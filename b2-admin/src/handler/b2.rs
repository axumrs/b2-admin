use std::sync::Arc;

use axum::{
    Json,
    extract::{Query, State},
};
use base64::Engine;
use s3::serde_types::ObjectIdentifier;

use crate::{
    ArcAppState, Error, Result,
    b2::{B2, model},
    mw::B2Get,
    payload, resp,
};

pub async fn dir(
    B2Get(b2, _): B2Get,
    Query(q): Query<payload::b2::DirQuery>,
) -> Result<Json<resp::Resp<Vec<model::Dir>>>> {
    let items = _list(b2, q.prefix()).await?;

    Ok(resp::ok(items).to_json())
}

pub async fn preview_text_file(
    B2Get(b2, _): B2Get,
    State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<String>>> {
    if !state.cfg.b2_action.preview.text_enable {
        return Err(Error::Forbidden("未开启文件预览".into()));
    }
    let prefix = q.prefix();
    let mime = mime_guess::from_path(&prefix)
        .first_or_octet_stream()
        .to_string();
    if !(mime.starts_with("text/") || mime.ends_with("/json") || mime.ends_with("/toml")) {
        return Err(Error::InvalidRequest("该文件不支持预览".into()));
    }

    let (head_obj, _) = b2.head_object(&prefix).await?;
    let size = match head_obj.content_length {
        Some(v) => v,
        None => return Err(Error::InvalidRequest("无法获取文件大小".into())),
    };

    if size > state.cfg.b2_action.preview.text_max_size as i64 {
        return Err(Error::InvalidRequest("文件过大".into()));
    }

    let data = b2.get_object(&prefix).await?.to_string()?;

    Ok(resp::ok(data).to_json())
}

pub async fn preview_image_file(
    B2Get(b2, _): B2Get,
    State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<String>>> {
    if !state.cfg.b2_action.preview.image_enable {
        return Err(Error::Forbidden("未开启图片预览".into()));
    }
    let prefix = q.prefix();
    let mime = mime_guess::from_path(&prefix)
        .first_or_octet_stream()
        .to_string();
    if !mime.starts_with("image/") {
        return Err(Error::InvalidRequest("该文件不支持预览".into()));
    }

    let (head_obj, _) = b2.head_object(&prefix).await?;
    let size = match head_obj.content_length {
        Some(v) => v,
        None => return Err(Error::InvalidRequest("无法获取文件大小".into())),
    };

    if size > state.cfg.b2_action.preview.image_max_size as i64 {
        return Err(Error::InvalidRequest("文件过大".into()));
    }
    let data = b2.get_object(&prefix).await?;
    let data = data.as_slice();
    let data = base64::engine::general_purpose::STANDARD.encode(data);
    Ok(resp::ok(format!("data:{mime};base64,{data}")).to_json())
}

pub async fn del(
    B2Get(b2, _): B2Get,
    State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<u16>>> {
    if !state.cfg.b2_action.delete_enable {
        return Err(Error::Forbidden("已关闭删除功能".into()));
    }
    let r = _del(b2, q.prefix()).await?;
    Ok(resp::ok(r).to_json())
}

pub async fn del_dir(
    B2Get(b2, _): B2Get,
    State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<usize>>> {
    if !state.cfg.b2_action.delete_enable {
        return Err(Error::Forbidden("已关闭删除功能".into()));
    }

    let prefix = q.prefix();
    assert!(!(prefix.is_empty() || prefix == "/"));

    // 列出所有子项
    let items = _list_children(b2.clone(), prefix).await?;

    let objs = items
        .iter()
        .map(|i| ObjectIdentifier::new(i.path.clone()))
        .collect::<Vec<_>>();

    let resp = b2.delete_objects(objs).await?;
    Ok(resp::ok(resp.deleted.len()).to_json())
}

async fn _list(b2: Arc<B2>, prefix: impl Into<String>) -> Result<Vec<model::Dir>> {
    let ls = b2.list(prefix.into(), Some("/".into())).await?;
    let mut items = vec![];
    for i in ls {
        let item = model::Dir {
            path: i.prefix.unwrap_or_default().clone(),
            ..Default::default()
        };
        let file_list = i
            .contents
            .iter()
            .map(|c| {
                let filename = std::path::Path::new(&c.key)
                    .file_name()
                    .unwrap_or_default()
                    .to_str()
                    .unwrap_or_default()
                    .to_string();

                let mime = mime_guess::from_path(&c.key)
                    .first_or_octet_stream()
                    .to_string();
                let ext = mime_guess::get_mime_extensions_str(&mime)
                    .unwrap_or_default()
                    .to_owned()
                    .first()
                    .unwrap_or(&"")
                    .to_string();
                model::File {
                    path: c.key.clone(),
                    size: c.size,
                    mime,
                    last_modified: c.last_modified.clone(),
                    ext_name: ext,
                    name: filename,
                }
            })
            .collect::<Vec<_>>();
        let sub_dirs = i
            .common_prefixes
            .unwrap_or(vec![])
            .iter()
            .map(|c| {
                let dir_name = std::path::Path::new(&c.prefix)
                    .file_name()
                    .unwrap_or_default()
                    .to_str()
                    .unwrap_or_default()
                    .to_string();
                model::Dir {
                    path: c.prefix.clone(),
                    name: dir_name,
                    ..Default::default()
                }
            })
            .collect();
        let item = model::Dir {
            sub_dirs,
            file_list,
            ..item
        };
        items.push(item);
    }
    Ok(items)
}
async fn _del(b2: Arc<B2>, prefix: impl Into<String>) -> Result<u16> {
    let prefix = prefix.into();
    assert!(!(prefix.is_empty() || prefix == "/"));

    let resp = b2.delete_object(&prefix).await?;

    Ok(resp.status_code())
}

async fn _list_children(b2: Arc<B2>, prefix: impl Into<String>) -> Result<Vec<model::File>> {
    let items = _list(b2.clone(), prefix).await?;
    let mut files = vec![];

    for item in items.iter() {
        if !item.sub_dirs.is_empty() {
            // 递归子目录
            for sub_dir in item.sub_dirs.iter() {
                let r = Box::pin(_list_children(b2.clone(), sub_dir.path.clone())).await?;
                files.extend(r);
            }
        }
    }

    // 文件列表
    for item in items {
        files.extend(item.file_list);
    }
    Ok(files)
}

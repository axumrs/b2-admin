use axum::{
    Json,
    extract::{Path, Query, State},
    response::IntoResponse,
};
use base64::Engine;

use crate::{ArcAppState, Error, Result, b2::model, mw::B2Get, payload, resp};

pub async fn dir(
    B2Get(b2, _): B2Get,
    Query(q): Query<payload::b2::DirQuery>,
) -> Result<Json<resp::Resp<Vec<model::Dir>>>> {
    let ls = b2.list(q.prefix(), Some("/".into())).await.unwrap();
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

    Ok(resp::ok(items).to_json())
}

pub async fn preview_text_file(
    B2Get(b2, _): B2Get,
    // State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<String>>> {
    let mime = mime_guess::from_path(&q.prefix)
        .first_or_octet_stream()
        .to_string();
    if !(mime.starts_with("text/") || mime.ends_with("/json") || mime.ends_with("/toml")) {
        return Err(Error::InvalidRequest("该文件不支持预览".into()));
    }

    let (head_obj, _) = b2.head_object(&q.prefix).await?;
    let size = match head_obj.content_length {
        Some(v) => v,
        None => return Err(Error::InvalidRequest("无法获取文件大小".into())),
    };

    if size > 1024 * 1024 * 1 {
        return Err(Error::InvalidRequest("文件过大".into()));
    }

    let data = b2.get_object(&q.prefix).await?.to_string()?;

    Ok(resp::ok(data).to_json())
}

pub async fn preview_image_file(
    B2Get(b2, _): B2Get,
    // State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
) -> Result<Json<resp::Resp<String>>> {
    let mime = mime_guess::from_path(&q.prefix)
        .first_or_octet_stream()
        .to_string();
    if !mime.starts_with("image/") {
        return Err(Error::InvalidRequest("该文件不支持预览".into()));
    }

    let (head_obj, _) = b2.head_object(&q.prefix).await?;
    let size = match head_obj.content_length {
        Some(v) => v,
        None => return Err(Error::InvalidRequest("无法获取文件大小".into())),
    };

    if size > 1024 * 1024 * 1 {
        return Err(Error::InvalidRequest("文件过大".into()));
    }
    let data = b2.get_object(&q.prefix).await?;
    let data = data.as_slice();
    let data = base64::engine::general_purpose::STANDARD.encode(data);
    Ok(resp::ok(format!("data:{mime};base64,{data}")).to_json())
}

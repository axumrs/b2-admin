use axum::{
    body::Body,
    extract::{Query, Request, State},
    http::{Method, StatusCode, header},
    response::{IntoResponse, Response},
};
use std::path::Path;
use tokio::{
    fs::File,
    io::{AsyncSeekExt, AsyncWriteExt},
};
use tokio_stream::StreamExt;
use tokio_util::io::ReaderStream;

use crate::{ArcAppState, Error, Result, mw::B2Get, payload};

pub async fn handler(
    B2Get(b2, b2_hash): B2Get,
    State(state): State<ArcAppState>,
    Query(q): Query<payload::b2::FileQuery>,
    r: Request,
) -> Result<impl IntoResponse> {
    if !state.cfg.b2_action.download.enable {
        return Err(Error::Forbidden("已关闭下载".into()));
    }

    let prefix = q.prefix();
    // 从请求头中获取B2的ID
    let (head_obj, _) = b2.head_object(&prefix).await?;
    let size = match head_obj.content_length {
        Some(v) => v,
        None => return Err(Error::InvalidRequest("无法获取文件大小".into())),
    };

    if *r.method() == Method::HEAD {
        return Ok(([(header::CONTENT_LENGTH, size)], ()).into_response());
    }

    let filename = head_obj
        .e_tag
        .unwrap_or(prefix.clone())
        .trim_matches('"')
        .to_string();

    if size > state.cfg.b2_action.download.max_size as i64 {
        return Err(Error::InvalidRequest(format!(
            "文件大小{size}超过允许下载的最大值"
        )));
    }

    let loc_file_id = xid::new().to_string();

    let loc_filename = state.cfg.b2_action.download_tmp_dir().join(format!(
        "{b2_hash}_{loc_file_id}_{}",
        filename.replace("/", "_")
    ));

    let mut async_output_file = File::create(&loc_filename).await?;
    let mut response_data_stream = b2.get_object_stream(&prefix).await?;
    while let Some(chunk) = response_data_stream.bytes().next().await {
        async_output_file.write_all(&chunk?).await?;
    }

    let file_path = Path::new(&loc_filename);
    let file = match File::open(&file_path).await {
        Ok(f) => f,
        Err(_) => return Ok((StatusCode::NOT_FOUND, "File not found").into_response()),
    };

    let file_len = file_path.metadata()?.len();

    // 解析 Range 头部 (如：bytes=0-1024)
    if let Some(range_header) = r.headers().get(header::RANGE) {
        if let Ok(range_str) = range_header.to_str() {
            if let Some(range) = parse_range(range_str, file_len) {
                let start = range.0;
                let end = range.1;
                let sub_len = end - start + 1;

                // 使用 tokio 将文件游标移动到 start
                let mut file = file;
                if file.seek(std::io::SeekFrom::Start(start)).await.is_err() {
                    return Ok(StatusCode::INTERNAL_SERVER_ERROR.into_response());
                }

                // 限制读取的字节数
                let stream = ReaderStream::new(tokio::io::AsyncReadExt::take(file, sub_len));

                let mut res = Response::new(Body::from_stream(stream));
                res.headers_mut()
                    .insert(header::CONTENT_TYPE, "application/octet-stream".parse()?);
                res.headers_mut().insert(
                    header::CONTENT_RANGE,
                    format!("bytes {}-{}/{}", start, end, file_len).parse()?,
                );
                res.headers_mut()
                    .insert(header::ACCEPT_RANGES, "bytes".parse()?);
                *res.status_mut() = StatusCode::PARTIAL_CONTENT;
                return Ok(res);
            }
        }
    }

    // 不支持 Range 或者全量下载请求
    let stream = ReaderStream::new(file);
    let mut res = Response::new(Body::from_stream(stream));
    res.headers_mut()
        .insert(header::CONTENT_TYPE, "application/octet-stream".parse()?);
    res.headers_mut()
        .insert(header::CONTENT_LENGTH, file_len.to_string().parse()?);
    res.headers_mut()
        .insert(header::ACCEPT_RANGES, "bytes".parse()?);
    Ok(res)
}

// 简单的 Range 解析辅助函数
fn parse_range(range_str: &str, file_len: u64) -> Option<(u64, u64)> {
    let parts: Vec<&str> = match range_str.strip_prefix("bytes=") {
        Some(v) => v.split('-').collect(),
        None => return None,
    };
    if parts.len() == 2 {
        let start: u64 = parts[0].parse().ok()?;
        let end: u64 = if parts[1].is_empty() {
            file_len - 1
        } else {
            parts[1].parse().ok()?
        };
        if start < file_len && end >= start {
            return Some((start, end.min(file_len - 1)));
        }
    }
    None
}

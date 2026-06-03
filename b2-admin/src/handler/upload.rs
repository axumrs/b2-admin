use axum::{
    Json,
    extract::{Multipart, State},
};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
};

use crate::{Error, mw::B2Get, resp};

#[derive(serde::Serialize)]
pub struct UploadResp {
    pub chunk_index: usize,
    pub total_chunks: usize,
    pub file_id: String,
    pub prefix: String,
    pub original_name: String,
    pub chunk_len: usize,
    pub is_last_chunk: bool,
}

pub async fn handler(
    B2Get(b2, b2_hash): B2Get,
    State(state): State<crate::ArcAppState>,
    mut multipart: Multipart,
) -> crate::Result<Json<resp::Resp<UploadResp>>> {
    if !state.cfg.b2_action.upload.enable {
        return Err(Error::Forbidden("已关闭上传".into()));
    }

    let mut chunk_index = 0usize;
    let mut total_chunks = 0usize;
    let mut file_id = String::new();
    let mut chunk_data = Vec::new();
    let mut original_name = String::new();
    let mut prefix = String::new();
    let mut file_size = 0usize;

    // 解析 Multipart 数据
    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or_default().to_string();

        if name == "chunkIndex" {
            chunk_index = field.text().await?.parse()?;
        } else if name == "totalChunks" {
            total_chunks = field.text().await?.parse()?;
        } else if name == "fileId" {
            file_id = field.text().await?;
        } else if name == "prefix" {
            prefix = field.text().await?;
        } else if name == "file" {
            original_name = field.file_name().unwrap_or_default().to_string();
            chunk_data = field.bytes().await?.to_vec();
            let size = chunk_data.len();
            if size > state.cfg.b2_action.upload.max_size as usize {
                // 如果分段大小都超过限制
                return Err(Error::InvalidRequest("文件大小超出限制".into()));
            }
            file_size += chunk_data.len();
        }
    }

    if file_size > state.cfg.b2_action.upload.max_size as usize {
        return Err(Error::InvalidRequest("文件大小超出限制".into()));
    }

    // 将分块写入临时目录 (例如 ./uploads/temp/)
    let temp_dir = &state.cfg.b2_action.upload_tmp_part_dir();
    fs::create_dir_all(temp_dir)?;
    let temp_file_path = temp_dir.join(format!("{}.part{}", file_id, chunk_index));

    let mut file = OpenOptions::new()
        .create(true)
        .write(true)
        .open(&temp_file_path)?;
    file.write_all(&chunk_data)?;

    let final_dir = &state.cfg.b2_action.upload_tmp_dir();
    fs::create_dir_all(final_dir)?;
    let final_path = final_dir.join(format!("{b2_hash}_{original_name}"));
    let is_last_chunk = chunk_index == total_chunks - 1;

    // 检查是否是最后一块，若是，则执行文件合并
    if is_last_chunk {
        let mut final_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&final_path)?;

        // 按顺序读取所有分块并拼接到目标文件
        for i in 0..total_chunks {
            let part_path = temp_dir.join(format!("{}.part{}", file_id, i));
            let part_data = fs::read(&part_path)?;
            final_file.write_all(&part_data)?;
            fs::remove_file(&part_path)?; // 清理分块
        }
    }
    // 上传到 B2
    let fm = file_format::FileFormat::from_file(&final_path)?;
    let content_type = fm.media_type();
    let b2_path = Path::new(&prefix);
    let b2_path = b2_path.join(&original_name);
    let b2_path = b2_path.to_str().unwrap();

    let mut b2_file = tokio::fs::File::open(&final_path).await?;
    let _ = b2
        .put_object_stream_with_content_type(&mut b2_file, b2_path, content_type)
        .await?;

    Ok(resp::ok(UploadResp {
        chunk_index,
        total_chunks,
        file_id,
        prefix,
        original_name,
        chunk_len: chunk_data.len(),
        is_last_chunk,
    })
    .to_json())
}

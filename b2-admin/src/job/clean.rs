use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::Config;

pub async fn clean_worker(cfg: Arc<Config>) -> anyhow::Result<()> {
    let upload_tmp_dir = cfg.b2_action.upload_tmp_dir();
    let upload_tmp_part_dir = cfg.b2_action.upload_tmp_part_dir();
    let down_tmp_dir = cfg.b2_action.download_tmp_dir();
    let preview_tmp_dir = cfg.b2_action.preview_tmp_dir();

    let upload_tmp_dir = Arc::new(upload_tmp_dir);
    let upload_tmp_part_dir = Arc::new(upload_tmp_part_dir);
    let down_tmp_dir = Arc::new(down_tmp_dir);
    let preview_tmp_dir = Arc::new(preview_tmp_dir);
    let max_minutes = cfg.clean.max_minutes;
    let interval = cfg.clean.interval;

    let handler_update = tokio::spawn(clean(upload_tmp_dir.clone(), max_minutes, interval));
    let handler_upload_parts =
        tokio::spawn(clean(upload_tmp_part_dir.clone(), max_minutes, interval));
    let handler_download = tokio::spawn(clean(down_tmp_dir.clone(), max_minutes, interval));
    let handler_preview = tokio::spawn(clean(preview_tmp_dir.clone(), max_minutes, interval));

    let _ = tokio::join!(
        handler_update,
        handler_upload_parts,
        handler_download,
        handler_preview
    );

    Ok(())
}

/// 清理
async fn clean(
    dir: Arc<std::path::PathBuf>,
    max_minutes: impl Into<i64> + Copy,
    interval: impl Into<u64> + Copy,
) -> anyhow::Result<()> {
    let worker_sleep = || {
        let duration = tokio::time::Duration::from_secs(interval.into());
        tokio::time::sleep(duration)
    };

    let continue_sleep = || {
        let duration = tokio::time::Duration::from_millis(rand::random_range(100..1000));
        tokio::time::sleep(duration)
    };

    loop {
        tracing::info!("{dir:?} 开始清理");
        let file_list = match list_dir(&dir).await {
            Ok(v) => v,
            Err(e) => {
                tracing::error!("读取{dir:?}失败：{:?}", e);
                continue_sleep().await;
                continue;
            }
        };
        let nums = file_list.len();
        remove_if_expired(max_minutes, file_list).await;

        tracing::debug!("{dir:?} 清理文件数量：{nums}");
        worker_sleep().await;
    }
}

/// 删除过期文件
async fn remove_if_expired(max_minutes: impl Into<i64> + Copy, file_list: Vec<std::path::PathBuf>) {
    for f in file_list.iter() {
        let md = match f.metadata() {
            Ok(md) => md,
            Err(e) => {
                tracing::error!("读取{f:?}元数据失败：{:?}", e);
                continue;
            }
        };
        let created = match md.created() {
            Ok(created) => created,
            Err(e) => {
                tracing::error!("读取{f:?}创建时间失败：{:?}", e);
                continue;
            }
        };
        let creted: DateTime<Utc> = created.into();
        let elasped = Utc::now() - creted;
        if elasped.num_minutes() >= max_minutes.into() {
            match tokio::fs::remove_file(f).await {
                Ok(_) => {
                    tracing::info!("已删除{f:?}");
                }
                Err(e) => {
                    tracing::error!("删除{f:?}失败：{:?}", e);
                }
            };
        }
    }
}

/// 读取目录里的所有文件
async fn list_dir(p: &std::path::Path) -> anyhow::Result<Vec<std::path::PathBuf>> {
    let mut file_list = vec![];
    if p.is_file() {
        // 读取文件元数据
        file_list.push(p.to_path_buf());
        return Ok(file_list);
    }
    if p.is_dir() {
        let mut entries = tokio::fs::read_dir(p).await?;
        while let Some(entry) = entries.next_entry().await? {
            let ep = entry.path();
            if ep.is_file() {
                file_list.push(ep);
                continue;
            }
            if ep.is_dir() {
                let mut sub_dir = match Box::pin(list_dir(&ep)).await {
                    Ok(v) => v,
                    Err(e) => {
                        tracing::error!("读取子目录{ep:?}失败：{:?}", e);
                        continue;
                    }
                };
                file_list.append(&mut sub_dir);
            }
        }
    }
    Ok(file_list)
}

#[cfg(test)]
mod test {
    use super::*;

    #[tokio::test]
    async fn test_list_dir() {
        let p = std::path::Path::new("src");
        let list = list_dir(p).await.unwrap();
        for f in list.iter() {
            let md = f.metadata().unwrap();
            let created = md.created().unwrap();
            let created: chrono::DateTime<chrono::Utc> = created.into();
            let elasped = chrono::Utc::now() - created;
            println!("{} {:?} {:?}", f.display(), created, elasped.num_minutes());
        }
    }
}

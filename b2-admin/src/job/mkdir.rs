use std::sync::Arc;

use crate::Config;

pub async fn mkdir_worker(cfg: Arc<Config>) -> anyhow::Result<()> {
    let update_tmp_dir = cfg.b2_action.upload_tmp_dir();
    let upload_tmp_part_dir = cfg.b2_action.upload_tmp_part_dir();
    let down_tmp_dir = cfg.b2_action.download_tmp_dir();
    let preview_tmp_dir = cfg.b2_action.preview_tmp_dir();

    for dir in [
        &update_tmp_dir,
        &upload_tmp_part_dir,
        &down_tmp_dir,
        &preview_tmp_dir,
    ] {
        tokio::fs::create_dir_all(dir).await?;
    }

    Ok(())
}

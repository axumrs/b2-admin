use axum::{Json, extract::State};

use crate::{ArcAppState, Result, resp};

#[derive(serde::Serialize)]
pub struct CfgGetResp {
    pub site_key: String,
    pub upload_enable: bool,
    pub upload_max_size: u64,
    pub upload_chunk_size: u64,
    pub download_enable: bool,
    pub download_chunk_size: u64,
    pub preview_text_enable: bool,
    pub preview_image_enable: bool,
    pub preview_text_max_size: u64,
    pub preview_image_max_size: u64,
    pub delete_enable: bool,
}
pub async fn get(State(state): State<ArcAppState>) -> Result<Json<resp::Resp<CfgGetResp>>> {
    let data = CfgGetResp {
        site_key: state.cfg.turnstile.site_key.clone(),
        upload_enable: state.cfg.b2_action.upload.enable,
        upload_max_size: state.cfg.b2_action.upload.max_size,
        upload_chunk_size: state.cfg.b2_action.upload.chunk_size,
        download_enable: state.cfg.b2_action.download.enable,
        download_chunk_size: state.cfg.b2_action.download.chunk_size,
        preview_text_enable: state.cfg.b2_action.preview.text_enable,
        preview_image_enable: state.cfg.b2_action.preview.image_enable,
        preview_text_max_size: state.cfg.b2_action.preview.text_max_size,
        preview_image_max_size: state.cfg.b2_action.preview.image_max_size,
        delete_enable: state.cfg.b2_action.delete_enable,
    };
    Ok(resp::ok(data).to_json())
}

use axum::{Json, extract::State};

use crate::{ArcAppState, Result, resp};

pub async fn site_key(State(state): State<ArcAppState>) -> Result<Json<resp::Resp<String>>> {
    Ok(resp::ok(state.cfg.turnstile.site_key.clone()).to_json())
}

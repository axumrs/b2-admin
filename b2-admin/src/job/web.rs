use std::sync::Arc;

use tokio::net::TcpListener;

use crate::{AppState, Config, b2, init};

pub async fn web_worker(cfg: Arc<Config>) -> anyhow::Result<()> {
    let web_addr = cfg.web_addr.clone();
    let listener = TcpListener::bind(&web_addr).await?;

    b2::share::from_cfg(&cfg.b2s).await;

    let state = AppState::new_arc(cfg);

    let app = init::router(state);

    tracing::info!("服务监听于：{web_addr}");
    axum::serve(listener, app).await?;
    Ok(())
}

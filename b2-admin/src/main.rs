use b2_admin::{Config, init, job};

fn main() -> anyhow::Result<()> {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(num_cpus::get())
        .thread_name(env!("CARGO_CRATE_NAME"))
        .enable_all()
        .build()?;
    rt.block_on(async_main())
}

async fn async_main() -> anyhow::Result<()> {
    let cfg = Config::from_toml()?.to_arc();
    init::log(&cfg.log);

    job::mkdir_worker(cfg.clone()).await?;

    let mut web_handler = tokio::spawn(job::web_worker(cfg.clone()));
    let mut clean_handler = tokio::spawn(job::clean_worker(cfg.clone()));

    tokio::select! {
        _ = &mut clean_handler => {
            tracing::info!("clean worker 已退出");
            web_handler.abort();
        }
        _ = &mut web_handler => {
            tracing::info!("web worker 已退出");
            clean_handler.abort();
        }
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("收到 Ctrl+C 信号");
            clean_handler.abort();
            web_handler.abort();
        }
    }
    Ok(())
}

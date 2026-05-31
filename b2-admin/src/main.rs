use b2_admin::{AppState, Config, b2, init};
use tokio::net::TcpListener;

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

    let web_addr = cfg.web_addr.clone();
    let listener = TcpListener::bind(&web_addr).await?;

    b2::share::from_cfg(&cfg.b2s).await;

    let state = AppState::new_arc(cfg);

    let app = init::router(state);

    tracing::info!("服务监听于：{web_addr}");
    axum::serve(listener, app).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use b2_admin::Config;
    use tokio_stream::StreamExt;

    #[tokio::test]
    async fn test_b2() {
        let cfg = Config::from_toml().unwrap();
        let b2 = cfg.b2s.first().unwrap();
        let cred = s3::creds::Credentials {
            access_key: Some(b2.key_id.clone()),
            secret_key: Some(b2.app_id.clone()),
            security_token: None,
            session_token: None,
            expiration: None,
        };
        let bucket =
            s3::Bucket::new(&b2.bucket_name, b2.endpoint.as_str().parse().unwrap(), cred).unwrap();

        // let ls = bucket.list(format!(""), Some("/".into())).await.unwrap(); // 根目录
        // let ls = bucket
        //     .list(format!("database/20260520/"), Some("/".into())) // 子目录
        //     .await
        //     .unwrap();
        // for item in ls.iter() {
        //     println!("{item:?}");
        // }

        let mut r = bucket.get_object_stream("/axum.eu.org.png").await.unwrap();
        while let Some(chunk) = r.bytes().next().await {
            println!("{:?}", chunk)
        }
    }
}

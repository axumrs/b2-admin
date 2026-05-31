use tracing_subscriber::{layer::SubscriberExt as _, util::SubscriberInitExt as _};

pub fn init(cfg_log: &str) {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                if cfg_log.is_empty() {
                    format!("{}=debug", env!("CARGO_CRATE_NAME"))
                } else {
                    cfg_log.to_string()
                }
                .into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
}

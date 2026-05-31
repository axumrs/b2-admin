use std::sync::Arc;

use crate::Config;

pub struct AppState {
    pub cfg: Arc<Config>,
}

impl AppState {
    pub fn new_arc(cfg: Arc<Config>) -> ArcAppState {
        Arc::new(Self { cfg })
    }
}

pub type ArcAppState = Arc<AppState>;

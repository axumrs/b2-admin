use axum::{
    Router,
    extract::DefaultBodyLimit,
    middleware::{from_extractor, from_extractor_with_state},
    routing::{delete, get, post},
};

use crate::{ArcAppState, handler, mw};

pub fn init(state: ArcAppState) -> Router {
    Router::new()
        .nest("/api", api_init(state.clone()))
        .nest("/api/auth", auth_init(state.clone()))
        .nest("/api/cfg", cfg_init(state.clone()))
        .layer(DefaultBodyLimit::max(state.cfg.body_limit))
        .fallback(handler::static_file::static_handler)
}

fn api_init(state: ArcAppState) -> Router {
    Router::new()
        .nest("/b2", b2_init(state.clone()))
        .merge(without_b2_init(state.clone()))
        .layer(from_extractor_with_state::<mw::AdminAuth, ArcAppState>(
            state,
        ))
}

fn b2_init(state: ArcAppState) -> Router {
    Router::new()
        .route("/", get(handler::b2::dir))
        .route("/preview-image", get(handler::b2::preview_image_file))
        .route("/preview-text", get(handler::b2::preview_text_file))
        .route("/download", get(handler::download::handler))
        .route("/upload", post(handler::upload::handler))
        .route("/del", delete(handler::b2::del))
        .route("/del-dir", delete(handler::b2::del_dir))
        .layer(from_extractor::<mw::B2Get>())
        .with_state(state)
}

fn without_b2_init(state: ArcAppState) -> Router {
    Router::new()
        .route("/b2-list", get(handler::b2_list::index))
        .with_state(state)
}

fn auth_init(state: ArcAppState) -> Router {
    Router::new()
        .route("/login", post(handler::auth::login))
        .layer(from_extractor::<mw::IpAndUserAgent>())
        .with_state(state)
}

fn cfg_init(state: ArcAppState) -> Router {
    Router::new()
        .route("/get", get(handler::cfg::get))
        .with_state(state)
}

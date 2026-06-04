use axum::{http, response::IntoResponse};

use crate::resp;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("S3错误")]
    S3(#[from] s3::error::S3Error),

    #[error("JSON错误")]
    SerdeJson(#[from] serde_json::Error),

    #[error("{0}")]
    InvalidRequest(String),

    #[error("UTF8错误")]
    Utf8(#[from] std::str::Utf8Error),

    #[error("IO错误")]
    Io(#[from] std::io::Error),

    #[error("文件上传错误")]
    Multipart(#[from] axum::extract::multipart::MultipartError),

    #[error("解析整数错误")]
    ParseInt(#[from] std::num::ParseIntError),

    #[error("JWT错误")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("{0}")]
    Unauthorized(String),

    #[error("{0}")]
    Forbidden(String),

    #[error("验证错误")]
    Validate(#[from] validator::ValidationErrors),

    #[error("HTTP请求错误")]
    Reqwest(#[from] reqwest::Error),

    #[error("HTTP请求头错误")]
    ReqwestHeaderValue(#[from] reqwest::header::InvalidHeaderValue),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl Error {
    pub fn code(&self) -> http::StatusCode {
        match self {
            Self::InvalidRequest(_) => http::StatusCode::BAD_REQUEST,
            Self::Unauthorized(_) | Self::Jwt(_) => http::StatusCode::UNAUTHORIZED,
            Self::Forbidden(_) => http::StatusCode::FORBIDDEN,
            _ => http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        tracing::error!("{self:?}");
        // (self.code(), resp::err(self).to_json()).into_response()
        resp::err(self).to_json().into_response()
    }
}

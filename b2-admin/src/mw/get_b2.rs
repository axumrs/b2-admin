use std::sync::Arc;

use axum::extract::FromRequestParts;

use crate::{
    b2::{B2, share},
    util,
};

pub struct B2Get(pub Arc<B2>, pub String);

impl<S> FromRequestParts<S> for B2Get
where
    S: Send + Sync,
{
    type Rejection = crate::Error;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _: &S,
    ) -> Result<Self, Self::Rejection> {
        // 从请求头中获取B2的ID
        let b2_hash = util::http::get_header_opt(&parts.headers, "X-B2");

        match b2_hash {
            Some(hash) => match share::get_b2(hash) {
                Some(v) => Ok(Self(v, hash.to_string())),
                None => Err(crate::Error::InvalidRequest("不存在的B2".into())),
            },
            None => Err(crate::Error::InvalidRequest("未提供B2的HASH".into())),
        }
    }
}

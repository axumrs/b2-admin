use axum::{extract::FromRequestParts, http::request::Parts};
use serde::{Deserialize, Serialize};

use crate::{Error, util};

#[derive(Serialize, Deserialize, Debug)]
pub struct IpAndUserAgent {
    pub ip: String,
    pub user_agent: String,
}

impl<S> FromRequestParts<S> for IpAndUserAgent
where
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let ip = util::http::get_ip(&parts.headers);
        let user_agent = util::http::get_user_agent(&parts.headers);

        Ok(Self {
            ip: ip.to_string(),
            user_agent: user_agent.to_string(),
        })
    }
}

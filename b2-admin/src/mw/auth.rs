use axum::extract::FromRequestParts;

use crate::{ArcAppState, Error, jwt, util};

pub struct AdminAuth(pub jwt::Claims);

impl FromRequestParts<ArcAppState> for AdminAuth {
    type Rejection = Error;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &ArcAppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_token = match util::http::get_auth_token(&parts.headers) {
            Some(v) => v,
            None => return Err(Error::Unauthorized("未授权".into())),
        };
        let nonce = match util::http::get_header_opt(&parts.headers, "X-NONCE") {
            Some(v) => v,
            None => return Err(Error::Unauthorized("未给定随机字符串".into())),
        };
        let user_agent = util::http::get_user_agent(&parts.headers);
        let ip = util::http::get_ip(&parts.headers);

        let claims = jwt::get_claims(auth_token, &state.cfg.jwt.secret)?;

        if claims.verify(jwt::SUB, jwt::ISSUER, user_agent, ip, nonce) {
            Ok(AdminAuth(claims))
        } else {
            Err(Error::Unauthorized("非法令牌".into()))
        }
    }
}

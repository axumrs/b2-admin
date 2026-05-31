use axum::{Json, extract::State};
use validator::Validate;

use crate::{ArcAppState, Error, Result, jwt, mw, payload, resp};

#[derive(serde::Serialize)]
pub struct LoginResp {
    pub token: String,
    pub nonce: String,
}
pub async fn login(
    mw::IpAndUserAgent { ip, user_agent }: mw::IpAndUserAgent,
    State(state): State<ArcAppState>,
    Json(frm): Json<payload::auth::LoginForm>,
) -> Result<Json<resp::Resp<LoginResp>>> {
    frm.validate()?;

    if !(frm.email == state.cfg.admin.email && frm.password == state.cfg.admin.password) {
        return Err(Error::InvalidRequest("用户名或密码错误".into()));
    }

    let data = jwt::ClaimsData::try_new(user_agent, ip)?;
    let nonce = data.nonce.clone();
    let token = jwt::token(data, &state.cfg.jwt.secret, state.cfg.jwt.expire.into())?;
    let data = LoginResp {
        token: token.to_string(),
        nonce,
    };
    Ok(resp::ok(data).to_json())
}

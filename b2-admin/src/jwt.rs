use rand::RngExt;
use serde::{Deserialize, Serialize};

use crate::{Result, util::sha256};

pub const ISSUER: &str = "AXUM.EU.ORG";
pub const SUB: &str = "/B2-ADMIN/ADMIN";

/// jwt payload
#[derive(Serialize, Deserialize, Debug)]
pub struct ClaimsData {
    pub client: String,
    pub user_agent: String,
    pub ip: String,
    pub nonce: String,
}

impl ClaimsData {
    pub fn try_new(user_agent: impl Into<String>, ip: impl Into<String>) -> Result<Self> {
        Self::try_new_with_nonce(
            user_agent,
            ip,
            rand::rng()
                .sample_iter(rand::distr::Alphanumeric)
                .take(6)
                .map(char::from)
                .collect::<String>(),
        )
    }

    pub fn try_new_with_nonce(
        user_agent: impl Into<String>,
        ip: impl Into<String>,
        nonce: impl Into<String>,
    ) -> Result<Self> {
        let cd = Self {
            client: Default::default(),
            user_agent: user_agent.into(),
            ip: ip.into(),
            nonce: nonce.into(),
        };
        let hash = sha256::hash_object(&cd)?;

        Ok(Self { client: hash, ..cd })
    }

    pub fn verify(
        &self,
        user_agent: impl Into<String>,
        ip: impl Into<String>,
        nonce: impl Into<String>,
    ) -> Result<bool> {
        let other = Self::try_new_with_nonce(user_agent, ip, nonce)?;
        Ok(self.client == other.client)
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Claims {
    pub sub: String,
    pub iss: String,
    pub exp: i64,
    pub iat: i64,
    pub data: ClaimsData,
}

impl Claims {
    pub fn new(sub: impl Into<String>, exp: i64, iat: i64, data: ClaimsData) -> Self {
        Self {
            sub: sub.into(),
            iss: ISSUER.into(),
            exp,
            iat,
            data,
        }
    }

    /// 生成带过去时间的 JWT
    pub fn with_exp(sub: impl Into<String>, exp_secs: u32, data: ClaimsData) -> Self {
        let iat = chrono::Utc::now().timestamp();
        let exp = iat + exp_secs as i64;
        Self::new(sub, exp, iat, data)
    }

    /// 生成 JWT 令牌
    pub fn encode(&self, secret: &[u8]) -> Result<Token> {
        Ok(Token(jsonwebtoken::encode(
            &jsonwebtoken::Header::default(),
            self,
            &jsonwebtoken::EncodingKey::from_secret(secret.into()),
        )?))
    }

    /// 解析 JWT
    pub fn decode(token: &str, secret: &[u8]) -> Result<Self> {
        Ok(jsonwebtoken::decode(
            token,
            &jsonwebtoken::DecodingKey::from_secret(secret.into()),
            &jsonwebtoken::Validation::default(),
        )?
        .claims)
    }

    /// 判断是否过期
    pub fn is_expired(&self) -> bool {
        self.exp < chrono::Utc::now().timestamp()
    }

    /// 验证元数据
    pub fn verify_meta(&self, sub: &str, iss: &str) -> bool {
        self.sub == sub && self.iss == iss
    }

    /// 验证客户端
    pub fn verify_client(
        &self,
        user_agent: impl Into<String>,
        ip: impl Into<String>,
        nonce: impl Into<String>,
    ) -> bool {
        self.data.verify(user_agent, ip, nonce).unwrap_or(false)
    }

    /// 验证
    pub fn verify(
        &self,
        sub: &str,
        iss: &str,
        user_agent: impl Into<String>,
        ip: impl Into<String>,
        nonce: impl Into<String>,
    ) -> bool {
        let vm = self.verify_meta(sub, iss);
        let ve = self.is_expired();
        let vc = self.verify_client(user_agent, ip, nonce);
        vm && (!ve) && vc
    }
}

/// JWT 令牌
#[derive(Serialize, Deserialize)]
pub struct Token(String);

impl Token {
    pub fn to_string(self) -> String {
        self.0
    }
}

/// 生成 JWT 令牌
pub fn token(data: ClaimsData, secret: &str, exp_secs: u32) -> Result<Token> {
    let claims = Claims::with_exp(SUB, exp_secs, data);
    claims.encode(secret.as_bytes())
}

/// 解析 JWT
pub fn get_claims(token: &str, secret: &str) -> Result<Claims> {
    Claims::decode(token, secret.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_gen_token() {
        let token = token(
            ClaimsData::try_new("user_agent", "ip").unwrap(),
            "secret",
            3600,
        )
        .unwrap();
        println!("{}", token.to_string());
    }
    #[test]
    fn test_jwt_get_claims() {
        let token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIvQjItQURNSU4vQURNSU4iLCJpc3MiOiJBWFVNLkVVLk9SRyIsImV4cCI6MTc3OTkzNzMyOCwiaWF0IjoxNzc5OTMzNzI4LCJkYXRhIjp7ImNsaWVudCI6IjBhNTQzMTJmMzJlNjFjMGUzYjJkYWMwNGI3YTA5NWEyNTA0MzYyMjU0ZmFkMjliZjgwMWYwOTFhNjhlMWM4NmMiLCJ1c2VyX2FnZW50IjoidXNlcl9hZ2VudCIsImlwIjoiaXAiLCJub25jZSI6Ik9RWE1JdyJ9fQ.FEr860-d6YkaKYEOlcwUhw2xwozzB-3Rfu2LygMoRSk";
        let claims = get_claims(token, "secret").unwrap();

        assert!(claims.verify(
            super::SUB,
            super::ISSUER,
            "user_agent",
            "ip",
            &claims.data.nonce
        ));
        println!("{}", serde_json::to_string(&claims).unwrap());
    }
}

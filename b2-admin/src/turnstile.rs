use serde::Deserialize;

const VERIFY_URL: &str = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
pub struct Turnstile<'a> {
    pub secret: &'a str,
    pub timeout: u8,
    client: reqwest::Client,
}

impl<'a> Turnstile<'a> {
    pub fn builder(secret: &'a str, timeout: u8) -> crate::Result<Self> {
        let client = reqwest::ClientBuilder::new()
            .timeout(std::time::Duration::from_secs(timeout as u64))
            .build()?;
        Ok(Self {
            secret,
            timeout,
            client,
        })
    }

    pub async fn verify(&self, token: &str) -> crate::Result<Response> {
        let form = [("secret", self.secret), ("response", token)];
        let res = self
            .client
            .post(VERIFY_URL)
            .form(&form)
            .send()
            .await?
            .json::<Response>()
            .await?;
        Ok(res)
    }
}

#[derive(Deserialize)]
pub struct Response {
    pub success: bool,
}

pub async fn verify<'a>(secret: &'a str, timeout: u8, token: &'a str) -> crate::Result<bool> {
    let turnstile = Turnstile::builder(secret, timeout)?;
    let res = turnstile.verify(token).await?;
    Ok(res.success)
}

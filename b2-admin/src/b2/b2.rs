use std::{collections::HashMap, ops::Deref, sync::Arc};

use crate::{B2Config, util::sha256};

pub struct B2 {
    pub hash: String,
    pub name: String,
    pub bucket_name: String,
    pub endpoint: String,
    pub key_id: String,
    pub app_id: String,
    bucket: Box<s3::Bucket>,
}

impl B2 {
    pub async fn connect(cfg: &B2Config) -> anyhow::Result<Self> {
        let cred = s3::creds::Credentials {
            access_key: Some(cfg.key_id.clone()),
            secret_key: Some(cfg.app_id.clone()),
            security_token: None,
            session_token: None,
            expiration: None,
        };
        let region = cfg.endpoint.as_str().parse()?;
        let bucket = s3::Bucket::new(&cfg.bucket_name, region, cred)?;
        let hash = sha256::hash_object(cfg)?;
        let obj = Self {
            name: cfg.name.clone(),
            bucket_name: cfg.bucket_name.clone(),
            endpoint: cfg.endpoint.clone(),
            key_id: cfg.key_id.clone(),
            app_id: cfg.app_id.clone(),
            bucket,
            hash,
        };

        Ok(obj)
    }
}

impl Deref for B2 {
    type Target = s3::Bucket;
    fn deref(&self) -> &Self::Target {
        &self.bucket
    }
}

pub struct B2List(HashMap<String, Arc<B2>>);

impl B2List {
    pub fn new() -> Self {
        Self(HashMap::new())
    }
    pub fn from_vec(b2_list: Vec<Arc<B2>>) -> Self {
        let m = b2_list
            .into_iter()
            .map(|b2| (b2.hash.clone(), b2))
            .collect();
        Self(m)
    }
    pub fn find(&self, id: &str) -> Option<Arc<B2>> {
        self.0.get(id).cloned()
    }
}

impl Deref for B2List {
    type Target = HashMap<String, Arc<B2>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

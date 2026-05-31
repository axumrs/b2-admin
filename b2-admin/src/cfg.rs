use std::{path, sync::Arc};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub log: String,
    pub web_addr: String,
    pub b2s: Vec<B2Config>,
    pub jwt: JwtConfig,
    pub b2_action: B2ActionConfig,
    pub admin: AdminConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct B2Config {
    pub name: String,
    pub endpoint: String,
    pub key_id: String,
    pub app_id: String,
    pub bucket_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub expire: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct B2ActionConfig {
    pub root_tmp_dir: String,
    pub upload: B2ActionUploadConfig,
    pub download: B2ActionDownloadConfig,
    pub preview: B2ActionPreviewConfig,
}

impl B2ActionConfig {
    pub fn upload_tmp_dir(&self) -> path::PathBuf {
        self.upload.tmp_dir(&self.root_tmp_dir)
    }
    pub fn upload_tmp_part_dir(&self) -> path::PathBuf {
        self.upload.tmp_part_dir(&self.root_tmp_dir)
    }
    pub fn download_tmp_dir(&self) -> path::PathBuf {
        self.download.tmp_dir(&self.root_tmp_dir)
    }
    pub fn preview_tmp_dir(&self) -> path::PathBuf {
        self.preview.tmp_dir(&self.root_tmp_dir)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct B2ActionUploadConfig {
    pub max_size: u64,
    pub tmp_dir: String,
    pub tmp_part_dir: String,
}
impl B2ActionUploadConfig {
    pub fn tmp_dir(&self, root: &str) -> path::PathBuf {
        path::Path::new(root).join(&self.tmp_dir)
    }
    pub fn tmp_part_dir(&self, root: &str) -> path::PathBuf {
        path::Path::new(root).join(&self.tmp_part_dir)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct B2ActionDownloadConfig {
    pub max_size: u64,
    pub tmp_dir: String,
}

impl B2ActionDownloadConfig {
    pub fn tmp_dir(&self, root: &str) -> path::PathBuf {
        path::Path::new(root).join(&self.tmp_dir)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct B2ActionPreviewConfig {
    pub text_max_size: u64,
    pub image_max_size: u64,
    pub tmp_dir: String,
}

impl B2ActionPreviewConfig {
    pub fn tmp_dir(&self, root: &str) -> path::PathBuf {
        path::Path::new(root).join(&self.tmp_dir)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdminConfig {
    pub email: String,
    pub password: String,
}

impl Config {
    pub fn from_toml() -> anyhow::Result<Self> {
        ::config::Config::builder()
            .add_source(::config::File::with_name("b2-admin"))
            .build()?
            .try_deserialize()
            .map_err(From::from)
    }

    pub fn to_arc(self) -> Arc<Self> {
        Arc::new(self)
    }
}

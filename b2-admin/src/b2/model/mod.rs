use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Dir {
    pub path: String,
    pub sub_dirs: Vec<Dir>,
    pub file_list: Vec<File>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    pub path: String,
    pub size: u64,
    pub mime: String,
    pub last_modified: String,
    pub ext_name: String,
    pub name: String,
}

use serde::Deserialize;

#[derive(Deserialize)]
pub struct DirQuery {
    pub prefix: Option<String>,
}

impl DirQuery {
    pub fn prefix(&self) -> String {
        match &self.prefix {
            Some(v) => v.clone(),
            None => "".into(),
        }
    }
}

#[derive(Deserialize)]
pub struct FileQuery {
    pub prefix: String,
}

impl FileQuery {
    pub fn prefix(&self) -> String {
        self.prefix.clone()
    }
}

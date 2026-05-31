use axum::Json;
use serde::Serialize;

use crate::Error;

#[derive(Serialize)]
pub struct Resp<T> {
    pub code: u16,
    pub msg: String,
    pub data: T,
}

impl<T: Serialize> Resp<T> {
    pub fn ok(data: T) -> Self {
        Self {
            code: 0,
            msg: "OK".into(),
            data,
        }
    }

    pub fn to_json(self) -> Json<Self> {
        Json(self)
    }
}

impl Resp<()> {
    pub fn err(err: Error) -> Self {
        Self {
            code: err.code().as_u16(),
            msg: err.to_string(),
            data: (),
        }
    }

    pub fn no_data() -> Self {
        Self::ok(())
    }
}

pub fn ok<T: Serialize>(data: T) -> Resp<T> {
    Resp::ok(data)
}

pub fn err(err: Error) -> Resp<()> {
    Resp::err(err)
}

pub fn no_data() -> Resp<()> {
    Resp::no_data()
}

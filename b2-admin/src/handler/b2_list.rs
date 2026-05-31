use std::borrow::Cow;

use axum::{Json, extract::State};

use crate::{ArcAppState, Result, b2::share, resp};

#[derive(serde::Serialize)]
pub struct B2ListResp {
    pub hash: String,
    pub name: String,
}

pub async fn index(State(state): State<ArcAppState>) -> Result<Json<resp::Resp<Vec<B2ListResp>>>> {
    let list = share::list()
        .iter()
        .map(|(hash, b)| (hash.clone(), b.name.clone()))
        .collect::<Vec<_>>();
    // 按配置的顺序排序
    let cfg_names = state
        .cfg
        .b2s
        .iter()
        .map(|b| Cow::Borrowed(&b.name))
        .collect::<Vec<_>>();
    let mut new_list = Vec::with_capacity(list.len());

    for name in cfg_names {
        let item = match list.iter().find(|(_, n)| Cow::Borrowed(n) == name) {
            Some((hash, name)) => B2ListResp {
                hash: hash.clone(),
                name: name.clone(),
            },
            None => {
                tracing::warn!("[b2-list] 未找到B2：{name}");
                continue;
            }
        };
        new_list.push(item);
    }

    Ok(Json(resp::ok(new_list)))
}

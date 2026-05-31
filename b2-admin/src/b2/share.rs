use std::sync::{Arc, LazyLock};

use arc_swap::ArcSwap;

use crate::B2Config;

use super::{B2, B2List};

static B2_LIST: LazyLock<ArcSwap<B2List>> = LazyLock::new(|| ArcSwap::new(Arc::new(B2List::new())));

pub fn get_b2(hash: &str) -> Option<Arc<B2>> {
    B2_LIST.load().find(hash)
}

pub fn list() -> Arc<B2List> {
    B2_LIST.load().clone()
}

pub async fn from_cfg(cfgs: &Vec<B2Config>) {
    let mut b2_list = Vec::with_capacity(cfgs.len());
    for cfg in cfgs {
        let b2 = match B2::connect(cfg).await {
            Ok(v) => v,
            Err(e) => {
                tracing::error!("B2连接失败：[{}] - {e}", cfg.name);
                continue;
            }
        };
        b2_list.push(Arc::new(b2));
    }

    B2_LIST.store(Arc::new(B2List::from_vec(b2_list)));
}

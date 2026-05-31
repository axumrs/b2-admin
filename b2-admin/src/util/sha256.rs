use sha2::{Digest, Sha256};

pub fn hash(data: impl AsRef<[u8]>) -> String {
    let h = Sha256::digest(data);
    let h = h.as_slice();
    hex::encode(h)
}

pub fn hash_object(data: &impl serde::Serialize) -> crate::Result<String> {
    let b = serde_json::to_vec(data)?;
    Ok(hash(&b))
}

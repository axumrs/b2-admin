use serde::Deserialize;
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct LoginForm {
    #[validate(email(message = "请输入邮箱"))]
    pub email: String,

    #[validate(length(min = 6, message = "请输入正确的密码"))]
    pub password: String,
}

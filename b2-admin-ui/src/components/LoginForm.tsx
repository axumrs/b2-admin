import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Turnstile from "./Turnstile";
import { useForm } from "@tanstack/react-form";

import * as z from "zod";
import useApi from "@/api/useApi";
import { useStateContext } from "@/contexts/StateContext";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  email: z.email("请输入正确的邮箱"),
  password: z.string().min(6, "密码至少6个字符"),
  captcha: z.string().min(21, "请完成验证码"),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const nav = useNavigate();
  const { loginApi } = useApi();
  const ctx = useStateContext();
  const loginMutation = loginApi(ctx, () => {
    nav("/");
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      captcha: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value);
    },
  });

  // useEffect(() => {
  //   $setLoading(loginMutation.isPending);
  // }, [loginMutation.isPending]);
  // useEffect(() => {
  //   if (!loginResp) return;
  //   if (loginResp.code !== 0) {
  //     $setErr(loginResp.msg || null);
  //     return;
  //   }
  // }, [loginResp]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">欢迎回来</CardTitle>
          <CardDescription>你需要登录才能使用本系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="post"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="email"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>密码</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="password"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="captcha"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>人机验证</FieldLabel>
                      <Turnstile
                        sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        onVerify={(token) => {
                          field.handleChange(token);
                        }}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <Field>
                <Button type="submit" size="lg">
                  登录
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

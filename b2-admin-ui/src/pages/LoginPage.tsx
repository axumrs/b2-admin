import { LoginForm } from "@/components/LoginForm";
import { ModeToggle } from "@/components/ModeToggle";

export default function LoginPage() {
  return (
    <>
      <div className="fixed top-4 right-4">
        <ModeToggle variant="outline" />
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center gap-2 self-center font-medium">
            <img src="/logo.png" className="size-6" alt="logo" />
            B2 管理面板
          </div>
          <LoginForm />
        </div>
      </div>
    </>
  );
}

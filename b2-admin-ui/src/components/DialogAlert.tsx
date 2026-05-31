import { AlertCircleIcon, CheckCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";
import { cn } from "@/lib/utils";

export function DialogAlert({
  children,
  variant,
  icon,
  title,
  className,
}: React.ComponentProps<typeof Alert> & { icon?: React.ReactNode } & {
  title?: string;
}) {
  return (
    <Alert variant={variant} className={cn("max-w-md", className)}>
      {icon}
      <AlertTitle>{title || "发生错误"}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
export function DialogErrorAlert({
  children,
}: React.ComponentProps<typeof DialogAlert>) {
  return (
    <DialogAlert variant="destructive" icon={<AlertCircleIcon />}>
      {children}
    </DialogAlert>
  );
}
export function DialogSuccessAlert({
  children,
  title,
}: React.ComponentProps<typeof DialogAlert>) {
  return (
    <DialogAlert
      className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50"
      icon={<CheckCircleIcon />}
      title={title || "成功"}
    >
      {children}
    </DialogAlert>
  );
}

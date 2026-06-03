import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";

export function Confirm({
  title,
  children,
  description,
  actionVariant,
  cancelText = "取消",
  onCancel,
  actionText = "确定",
  onAction,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  title?: string;
  description?: React.ReactNode;
  actionVariant?: "destructive" | "default";
  cancelText?: string;
  onCancel?: () => void;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent aria-describedby={title} id={title}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onCancel?.();
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={() => {
              onAction?.();
            }}
          >
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmDelete({
  children,
  itemName,
  ...props
}: React.ComponentProps<typeof Confirm> & { itemName?: string }) {
  return (
    <Confirm
      {...props}
      title="确认删除"
      actionVariant="destructive"
      description={
        <>
          删除后不可恢复，确定删除
          <span className="mx-1 text-destructive">{itemName || ""}</span>吗？
        </>
      }
    >
      {children}
    </Confirm>
  );
}

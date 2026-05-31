import useApi from "@/api/useApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type React from "react";
import { DialogErrorAlert } from "./DialogAlert";
import { LoadingIcon } from "./Icons";
import { Textarea } from "./ui/textarea";

export function PreviewText({ prefix }: { prefix: string }) {
  const { previewTextApi } = useApi();
  const { data, isFetching, error } = previewTextApi(prefix);
  return (
    <>
      {isFetching && (
        <div>
          <LoadingIcon className="size-8 animate-spin" />
        </div>
      )}
      {error && <DialogErrorAlert>{error.message}</DialogErrorAlert>}
      {data && !isFetching ? (
        <Textarea readOnly defaultValue={data}></Textarea>
      ) : (
        <></>
      )}
    </>
  );
}

export function PreviewTextDialog({
  children,
  prefix,
  onClose,
}: React.ComponentProps<typeof Dialog> &
  React.ComponentProps<typeof PreviewText> & {
    onClose?: () => void;
  }) {
  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o) {
          onClose?.();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>文件内容</DialogTitle>
          <DialogDescription asChild>
            <div className="my-3">
              <PreviewText prefix={prefix} />
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

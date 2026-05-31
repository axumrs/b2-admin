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

export function PreviewImage({ prefix }: { prefix: string }) {
  const { previewImageApi } = useApi();
  const { data, isFetching, error } = previewImageApi(prefix);
  return (
    <>
      {isFetching && (
        <div>
          <LoadingIcon className="size-8 animate-spin" />
        </div>
      )}
      {error && <DialogErrorAlert>{error.message}</DialogErrorAlert>}
      {data && !isFetching ? (
        <img src={data} className="w-full object-cover" />
      ) : (
        <></>
      )}
    </>
  );
}

export function PreviewImageDialog({
  children,
  prefix,
  onClose,
}: React.ComponentProps<typeof Dialog> &
  React.ComponentProps<typeof PreviewImage> & {
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
          <DialogTitle>图片预览</DialogTitle>
          <DialogDescription asChild>
            <div className="my-3">
              <PreviewImage prefix={prefix} />
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

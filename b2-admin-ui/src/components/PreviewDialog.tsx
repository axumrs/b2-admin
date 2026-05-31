import React, { useMemo } from "react";
import { PreviewImageDialog } from "./PreviewImage";
import { PreviewTextDialog } from "./PreviewText";

export default function PreviewDialog({
  file,
  ...props
}: React.ComponentProps<typeof PreviewImageDialog> &
  React.ComponentProps<typeof PreviewTextDialog> & { file: B2File }) {
  const isTextFile = useMemo(() => {
    return file.mime.startsWith("text/");
  }, [file]);
  const isImageFile = useMemo(() => {
    return file.mime.startsWith("image/");
  }, [file]);
  if (isTextFile) {
    return <PreviewTextDialog {...props} prefix={file.path} />;
  }
  if (isImageFile) {
    return <PreviewImageDialog {...props} prefix={file.path} />;
  }
  return <></>;
}

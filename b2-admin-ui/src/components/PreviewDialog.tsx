import React, { useMemo } from "react";
import { PreviewImageDialog } from "./PreviewImage";
import { PreviewTextDialog } from "./PreviewText";
import { useStateContext } from "@/contexts/StateContext";

import { PreviewOffIcon } from "./Icons";

export default function PreviewDialog({
  file,

  ...props
}: React.ComponentProps<typeof PreviewImageDialog> &
  React.ComponentProps<typeof PreviewTextDialog> & {
    file: B2File;
  }) {
  const { $cfg: cfg } = useStateContext();
  const isTextFile = useMemo(() => {
    return file.mime.startsWith("text/");
  }, [file]);
  const isImageFile = useMemo(() => {
    return file.mime.startsWith("image/");
  }, [file]);
  const textFilePrivewEnable = useMemo(
    () =>
      cfg?.preview_text_enable === true &&
      file.size <= cfg?.preview_text_max_size,
    [file, cfg],
  );
  const imageFilePrivewEnable = useMemo(
    () =>
      cfg?.preview_image_enable === true &&
      file.size <= cfg?.preview_image_max_size,
    [file, cfg],
  );
  if (isTextFile && textFilePrivewEnable) {
    return <PreviewTextDialog {...props} prefix={file.path} />;
  }
  if (isImageFile && imageFilePrivewEnable) {
    return <PreviewImageDialog {...props} prefix={file.path} />;
  }
  return (
    <div className="text-sm flex items-center gap-x-2 px-1.5 py-1 text-muted-foreground">
      <PreviewOffIcon className="size-4" />
      <span className="line-through">预览</span>
    </div>
  );
}

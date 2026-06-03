import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription } from "./ui/field";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { UploadIcon } from "./Icons";
import { Input } from "@/components/ui/input";
import { nanoid } from "nanoid";
import { DialogErrorAlert, DialogSuccessAlert } from "./DialogAlert";
import { $json_fetch } from "@/fetch";
import { useStateContext } from "@/contexts/StateContext";

export function Upload({
  defaultPrefix = "",
  cfg,
}: {
  defaultPrefix?: string;
  onCompleted?: () => void;
  cfg?: ApiConfig;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  const [prefix, setPrefix] = useState(defaultPrefix);
  const handleUpload = async () => {
    if (!file) return;
    if (!cfg) {
      setErrMsg("配置文件不存在");
      return;
    }

    if (!cfg.upload_enable) {
      setErrMsg("上传已关闭");
      return;
    }

    if (file.size > cfg.upload_max_size) {
      setErrMsg(`文件大小超出限制`);
      return;
    }

    const chunkSize = cfg.upload_chunk_size || 1 * 1024 * 1024; // 1kb 每块
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = nanoid(); // 生成唯一标识符

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
      const formData = new FormData();

      formData.append("file", chunk, file.name);
      formData.append("chunkIndex", `${i}`);
      formData.append("totalChunks", `${totalChunks}`);
      formData.append("fileId", fileId);
      formData.append("prefix", prefix);

      try {
        // 发送分块到 Axum 后端
        const { data: apiResp } = await $json_fetch.post<
          ApiResponse<ApiUpload>
        >("/b2/upload", formData);

        if (apiResp.code !== 0) {
          throw new Error(apiResp.msg);
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
        if (apiResp.data.is_last_chunk) {
          setUploadDone(true);
        }
      } catch (error) {
        setErrMsg(`第 ${i} 块上传失败: ${error}`);
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      {errMsg ? (
        <DialogErrorAlert>{errMsg}</DialogErrorAlert>
      ) : (
        <>
          {progress <= 0 ? (
            <>
              <Field>
                <FieldLabel htmlFor="file">文件</FieldLabel>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="prefix">位置</FieldLabel>
                <Input
                  id="prefix"
                  type="input"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder={`${prefix === "" || prefix === "/" ? "提示：当前为根目录，你可以将其值保持空白" : ""}`}
                />
                <FieldDescription>
                  1. 你可以在当前位置的基础上自定义位置
                  <br />
                  2. 如果指定的位置不存在，将在上传时自动创建对应的目录
                  <br />
                  3. 如果要上传的根目录，保持空白，或填入
                  <code className="font-mono mx-1 px-1.5 py-0.5 ring  ring-inset rounded ring-muted">
                    /
                  </code>
                </FieldDescription>
              </Field>
              <Button onClick={handleUpload}>
                <UploadIcon />
                开始上传
              </Button>
            </>
          ) : (
            <>
              {uploadDone ? (
                <DialogSuccessAlert>文件上传完成</DialogSuccessAlert>
              ) : (
                <Field className="w-full max-w-sm">
                  <FieldLabel htmlFor="progress-upload">
                    <span>上传进度</span>
                    <span className="ml-auto">{progress.toFixed(2)}%</span>
                  </FieldLabel>
                  <Progress max={100} value={progress} id="progress-upload" />
                </Field>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function UploadDialog({
  children,
  onClose,
  ...props
}: {
  children: React.ReactNode;
  onClose?: () => void;
} & React.ComponentProps<typeof Upload>) {
  const [open, setOpen] = useState(false);
  const { $cfg } = useStateContext();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          onClose?.();
        }
      }}
    >
      <DialogTrigger asChild>
        {$cfg?.upload_enable === true ? (
          children
        ) : (
          <Button disabled>
            <UploadIcon className="size-4" />
            上传
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>文件上传</DialogTitle>
          <DialogDescription asChild>
            <div className="my-3">
              <Upload
                cfg={$cfg!}
                {...props}
                onCompleted={() => setOpen(false)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field";
import { DialogErrorAlert } from "./DialogAlert";
import { FetchException, UnauthorizedException } from "@/types/errs";

export function Download({
  prefix,
  name,
  onCompleted,
}: {
  prefix: string;
  name: string;
  onCompleted?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const isCompleted = useMemo(
    () => errMsg === null && progress >= 100,
    [progress, errMsg],
  );

  useEffect(() => {
    downloadInChunks().then();
  }, []);

  useEffect(() => {
    if (isCompleted) {
      onCompleted?.();
    }
  }, [isCompleted]);

  const tryGetChunksError = async (chunks: BlobPart[]) => {
    // 尝试解析为JSON（出错的话，服务器会返回JSON数据）
    try {
      // 1. 创建 FileReader 对象
      const reader = new FileReader();

      // 2. 将 Blob 读取为文本
      reader.readAsText(new Blob(chunks), "utf-8");

      // 3. 使用 Promise 包装异步读取过程
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result?.toString() || "");
        reader.onerror = (error) => reject(error);
      });

      // 4. 将解析出的文本转换为 JSON 对象
      const resp = JSON.parse(text) as ApiResponse<string>;
      if (resp.code === 401) {
        // return new UnauthorizedException(resp.msg);
        return `/LOGIN/${resp.msg}`;
      }
      if (resp.code !== 0) {
        // return new FetchException(resp.msg);
        return resp.msg;
      }
      return null;
    } catch (e) {
      if (e as SyntaxError) {
        // JSON 解析错误
        return null;
      }
      throw e;
    }
  };
  const downloadInChunks = async () => {
    const url = `/api/b2/download?prefix=${prefix}`; // 对应你的 Axum 路由
    const chunkSize = 5 * 1024 * 1024; // 5MB

    try {
      // 1. 获取文件总大小
      const headRes = await fetch(url, {
        method: "HEAD",
        headers: {
          "X-B2":
            "e074509bb0f5873111d2c773c3f479d52b96dbce5ea7550853c4910fda8ac067",
        },
      });
      const fileSize = parseInt(headRes.headers.get("content-length")!, 10);

      let downloadedBytes = 0;
      const chunks = [];

      // 2. 分块下载
      while (downloadedBytes < fileSize) {
        const start = downloadedBytes;
        const end = Math.min(downloadedBytes + chunkSize - 1, fileSize - 1);

        const response = await fetch(url, {
          headers: {
            Range: `bytes=${start}-${end}`,
            "X-B2":
              "e074509bb0f5873111d2c773c3f479d52b96dbce5ea7550853c4910fda8ac067",
          },
        });

        const blob = await response.blob();
        chunks.push(blob);

        downloadedBytes = end + 1;
        setProgress((downloadedBytes / fileSize) * 100);
      }

      // 尝试解析为JSON（出错的话，服务器会返回JSON数据）
      const chunksError = await tryGetChunksError(chunks);
      if (chunksError) {
        setErrMsg(chunksError);
        return;
      }

      // 3. 组装并保存文件
      const completeBlob = new Blob(chunks, {
        type: "application/octet-stream",
      });
      const downloadUrl = window.URL.createObjectURL(completeBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        // 跳转到登录页
      }
      if (e instanceof FetchException) {
        setErrMsg(e.message);
      }
      setErrMsg(`${e}`);
    }
  };

  return (
    <div className="space-y-3">
      {isCompleted && <div>下载完成</div>}
      {errMsg ? (
        <DialogErrorAlert>{errMsg}</DialogErrorAlert>
      ) : (
        <>
          <div>
            <Field className="w-full max-w-sm">
              <FieldLabel htmlFor="progress-upload">
                <span>下载进度</span>
                <span className="ml-auto">{progress.toFixed(2)}%</span>
              </FieldLabel>
              <Progress max={100} value={progress} id="progress-upload" />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}

export default function DownloadDialog({
  children,
  onClose,
  ...props
}: {
  children: React.ReactNode;
  onClose?: () => void;
} & React.ComponentProps<typeof Download>) {
  const [open, setOpen] = useState(false);
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>文件下载</DialogTitle>
          <DialogDescription asChild>
            <div className="my-3">
              <Download {...props} onCompleted={() => setOpen(false)} />
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

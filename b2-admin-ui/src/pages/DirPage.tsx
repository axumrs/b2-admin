import useApi from "@/api/useApi";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useSearchParams } from "react-router-dom";
import DirPageBreadcrumb from "@/components/DirPageBreadcrumb";
import {
  DirIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileArchiveIcon,
  DeleteIcon,
  PreviewIcon,
  DownloadIcon,
  MoreIcon,
  ListIcon,
  UploadIcon,
} from "@/components/Icons";
import type React from "react";
import { formatDateTime } from "@/lib/dt";
import { formatBytes } from "@/lib/bytes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useState, lazy, useEffect } from "react";
import UploadDialog from "@/components/Upload";
import { useStateContext } from "@/contexts/StateContext";
const PreviewDialog = lazy(() => import("@/components/PreviewDialog"));
const DownloadDialog = lazy(() => import("@/components/Download"));

export default function DirPage() {
  const [sp, _] = useSearchParams();
  const prefix = sp.get("prefix") || "";

  const { $b2 } = useStateContext();

  const { dirB2Api } = useApi();
  const { data, refetch } = dirB2Api(prefix);

  useEffect(() => {
    if ($b2) {
      refetch();
    }
  }, [$b2]);

  return (
    <>
      <div className="flex justify-between items-center gap-x-4 my-3">
        <DirPageBreadcrumb prefix={prefix} />
        <div>
          <UploadDialog
            prefix={prefix}
            onClose={() => {
              refetch();
            }}
          >
            <Button>
              <UploadIcon />
              上传
            </Button>
          </UploadDialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item) =>
            item.sub_dirs.map((dir) => (
              <TableRow key={dir.path}>
                <TableCell>
                  <div className="flex items-center gap-x-1">
                    <DirIcon className="size-4" />
                    <Link to={{ pathname: "/", search: `?prefix=${dir.path}` }}>
                      {dir.name}
                    </Link>
                  </div>
                </TableCell>

                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <DirDownMenu b2dir={dir}>
                    <Button variant="ghost">
                      <MoreIcon />
                    </Button>
                  </DirDownMenu>
                </TableCell>
              </TableRow>
            )),
          )}
          {data?.map((item) =>
            item.file_list.map((file) => (
              <TableRow key={file.path}>
                <TableCell>
                  <div className="flex items-center gap-x-1">
                    <GuessFileIcon mime={file.mime} className="size-4" />
                    <FileDownMenu file={file}>
                      <button className="outline-0">{file.name}</button>
                    </FileDownMenu>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-baseline gap-x-1">
                    <div>{formatBytes(file.size)[0]}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(file.size)[1]}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(file.last_modified)}</TableCell>
                <TableCell>
                  <FileDownMenu file={file}>
                    <Button variant="ghost">
                      <MoreIcon />
                    </Button>
                  </FileDownMenu>
                </TableCell>
              </TableRow>
            )),
          )}
        </TableBody>
      </Table>
    </>
  );
}

function GuessFileIcon({
  mime,
  className,
}: { mime: string } & React.ComponentProps<"svg">) {
  if (mime.startsWith("image/")) {
    return <FileImageIcon className={className} />;
  }
  if (mime.startsWith("text/")) {
    return <FileTextIcon className={className} />;
  }

  if (
    mime.endsWith("/zip") ||
    mime.endsWith("/gzip") ||
    mime.endsWith("/tar") ||
    mime.endsWith("/7z") ||
    mime.endsWith("/tgz") ||
    mime.endsWith("/bzip2") ||
    mime.endsWith("/xz") ||
    mime.endsWith("/rar")
  ) {
    return <FileArchiveIcon className={className} />;
  }
  return <FileIcon className={className} />;
}

function FileDownMenu({
  file,
  children,
}: { file: B2File } & React.ComponentProps<typeof DropdownMenu>) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={(o) => setOpen(o)}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <PreviewDialog
              file={file}
              prefix={file.path}
              onClose={() => setOpen(false)}
            >
              <Button
                className="outline-0 w-full justify-start px-1.5"
                variant="ghost"
              >
                <PreviewIcon />
                预览
              </Button>
            </PreviewDialog>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <DownloadDialog
              prefix={file.path}
              name={file.name}
              onClose={() => setOpen(false)}
            >
              <Button
                className="outline-0 w-full justify-start px-1.5"
                variant="ghost"
              >
                <DownloadIcon />
                下载
              </Button>
            </DownloadDialog>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <DeleteIcon />
            删除
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function DirDownMenu({
  b2dir,
  children,
}: { b2dir: B2Dir } & React.ComponentProps<typeof DropdownMenu>) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={(o) => setOpen(o)}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Button variant="ghost" asChild>
              <Link
                to={{ pathname: "/", search: `?prefix=${b2dir.path}` }}
                className="flex items-center justify-start"
              >
                <ListIcon />
                查看列表
              </Link>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <DeleteIcon />
            删除目录
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

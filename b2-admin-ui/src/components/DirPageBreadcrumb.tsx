import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { RootDirCloseIcon, RootDirIcon } from "@/components/Icons";
export default function DirPageBreadcrumb({
  prefix,
}: React.ComponentProps<typeof Breadcrumb> & { prefix: string }) {
  const prefix_arr = prefix.replace(/\/$/, "").split("/");
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {prefix.length > 0 ? (
          <>
            <BreadcrumbItem key={`breadcrumb-${prefix}-root`}>
              <BreadcrumbLink asChild>
                <div className="flex items-center gap-x-1">
                  <RootDirIcon className="size-4" />
                  <Link to="/">根目录</Link>
                </div>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : (
          <BreadcrumbItem key={`breadcrumb-${prefix}-root`}>
            <BreadcrumbPage>
              <div className="flex items-center gap-x-1">
                <RootDirCloseIcon className="size-4" />
                <span>根目录</span>
              </div>
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}

        {prefix_arr.map((item, index) =>
          index === prefix_arr.length - 1 ? (
            <BreadcrumbItem key={`breadcrumb-${prefix}-${item}`}>
              <BreadcrumbPage>{item}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <React.Fragment key={`breadcrumb-${prefix}-${item}`}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to={{
                      pathname: "/",
                      search: `?prefix=${prefix_arr.slice(0, index + 1).join("/")}/`,
                    }}
                  >
                    {item}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

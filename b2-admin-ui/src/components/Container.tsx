import { cn } from "@/lib/utils";
import React from "react";

export default function Container({
  className,
  children,
}: React.ComponentProps<"div">) {
  return <div className={cn("container mx-auto", className)}>{children}</div>;
}

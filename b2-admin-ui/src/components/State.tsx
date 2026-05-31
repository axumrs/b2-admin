import { UnauthorizedException } from "@/types/errs";
import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { LoadingIcon } from "./Icons";
import { toast } from "sonner";

export default function State({
  loading,
  error,
  message,
  children,
}: {
  loading?: boolean;
  error?: any;
  message?: string;
} & React.ComponentProps<typeof React.Fragment>) {
  const isUnauthorizedException = useMemo(() => {
    if (!error) {
      return false;
    }
    return error instanceof UnauthorizedException;
  }, [error]);

  if (isUnauthorizedException) {
    return <Navigate to="/login" />;
  }

  if (error) {
    toast.error(error.message);
  }

  if (message) {
    toast.success(message);
  }
  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-10 bg-background/10 backdrop-blur-xs">
          <div className="p-6  absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoadingIcon className="size-8 animate-spin" />
          </div>
        </div>
      )}
      {children}
    </>
  );
}

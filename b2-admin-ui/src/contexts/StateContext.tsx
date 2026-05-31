import { LoadingIcon } from "@/components/Icons";
import { FetchException, UnauthorizedException } from "@/types/errs";
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

export type StateContextError =
  | UnauthorizedException
  | FetchException
  | Error
  | string
  | null;

export type StateContextProps = {
  $err: StateContextError;
  $setErr: React.Dispatch<React.SetStateAction<StateContextError>>;
  $loading: boolean;
  $setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  $msg: string | null;
  $setMsg: React.Dispatch<React.SetStateAction<string | null>>;
};

export const DefaultStateContextProps: StateContextProps = {
  $err: null,
  $setErr: () => {},
  $loading: false,
  $setLoading: () => {},
  $msg: null,
  $setMsg: () => {},
};

export const StateContext = createContext<StateContextProps>({
  ...DefaultStateContextProps,
});

export const useStateContext = () => useContext(StateContext);

export default function StateContextProvider({
  children,
}: StateContextProps & { children: React.ReactNode }) {
  const [_err, _setErr] = useState<StateContextError>(null);
  const [_loading, _setLoading] = useState<boolean>(false);
  const [_msg, _setMsg] = useState<string | null>(null);

  if (_err) {
    if (_err instanceof UnauthorizedException) {
      // 登录
    } else if (_err instanceof FetchException || _err instanceof Error) {
      toast.error(_err.message);
    } else {
      toast.error(_err);
    }
  }

  if (_msg) {
    toast.success(_msg);
  }

  return (
    <StateContext.Provider
      value={{
        $err: _err,
        $setErr: _setErr,
        $loading: _loading,
        $setLoading: _setLoading,
        $msg: _msg,
        $setMsg: _setMsg,
      }}
    >
      {_loading && (
        <div className="fixed inset-0 z-10 bg-background/10 backdrop-blur-xs">
          <div className="p-6  absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LoadingIcon className="size-8 animate-spin" />
          </div>
        </div>
      )}
      {children}
    </StateContext.Provider>
  );
}

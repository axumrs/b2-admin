import { LoadingIcon } from "@/components/Icons";
import { FetchException, UnauthorizedException } from "@/types/errs";
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { useSessionStorage } from "react-use";

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
  $auth: JwtAuth | null;
  $setAuth: (auth: JwtAuth | null) => void;
  $b2: B2Lite | null;
  $setB2: (b2: B2Lite | null) => void;
};

export const DefaultStateContextProps: StateContextProps = {
  $err: null,
  $setErr: () => {},
  $loading: false,
  $setLoading: () => {},
  $msg: null,
  $setMsg: () => {},
  $auth: null,
  $setAuth: () => {},
  $b2: null,
  $setB2: () => {},
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
  const [_auth, _setAuth] = useSessionStorage<JwtAuth | null>("auth");
  const [_b2, _setB2] = useSessionStorage<B2Lite | null>("b2");

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
        $auth: _auth,
        $setAuth: _setAuth,
        $b2: _b2,
        $setB2: _setB2,
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

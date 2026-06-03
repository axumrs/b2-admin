import { $del, $get, $json_fetch } from "@/fetch";
import {
  useMutation,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  useStateContext,
  type StateContextProps,
} from "@/contexts/StateContext";
import { useEffect } from "react";
import { UnauthorizedException } from "@/types/errs";
import { useNavigate } from "react-router-dom";

export default function useApi() {
  const listB2Api = () =>
    useQuery({
      queryKey: ["b2-list"],
      queryFn: () => $get<B2Lite[]>("/b2-list"),
    });

  const dirB2Api = (prefix: string = "") =>
    useQuery({
      queryKey: ["b2-dir", prefix],
      queryFn: () => $get<B2Dir[]>(`/b2`, { prefix }),
    });

  const previewImageApi = (prefix: string) =>
    useQuery({
      queryKey: ["b2-preview-img", prefix],
      queryFn: () => $get<string>(`/b2/preview-image`, { prefix }),
    });
  const previewTextApi = (prefix: string) =>
    useQuery({
      queryKey: ["b2-preview-text", prefix],
      queryFn: () => $get<string>(`/b2/preview-text`, { prefix }),
    });
  const delObjApi = (ctx: StateContextProps, callback: () => void) =>
    useMutation({
      mutationKey: ["b2-del"],
      mutationFn: (prefix: string) =>
        $del<ApiResponse<number>>(`/b2/del`, { prefix }),
      onSuccess(resp) {
        if (resp.code !== 0) {
          ctx.$setErr(resp.msg);
          setTimeout(() => ctx.$setErr(null), 3000);
        }
        callback();
      },
    });
  const delDirApi = (ctx: StateContextProps, callback: () => void) =>
    useMutation({
      mutationKey: ["b2-del-dir"],
      mutationFn: (prefix: string) =>
        $del<ApiResponse<number>>(`/b2/del-dir`, { prefix }),
      onSuccess(resp) {
        if (resp.code !== 0) {
          ctx.$setErr(resp.msg);
          setTimeout(() => ctx.$setErr(null), 3000);
        }
        callback();
      },
    });
  const loginApi = (ctx: StateContextProps, callback: () => void) => {
    return useMutation({
      mutationKey: ["login"],
      onSuccess(data) {
        const resp = data.data;
        if (resp.code !== 0) {
          ctx.$setErr(resp.msg);
          setTimeout(() => ctx.$setErr(null), 3000);
        } else {
          ctx.$setAuth(resp.data);
          callback();
        }
      },
      mutationFn: (data: {
        email: string;
        password: string;
        captcha: string;
      }) => $json_fetch.post<ApiResponse<JwtAuth>>(`/auth/login`, data),
    });
  };

  return {
    listB2Api: (...args: Parameters<typeof listB2Api>) =>
      $useApi(listB2Api, ...args),
    dirB2Api: (...args: Parameters<typeof dirB2Api>) =>
      $useApi(dirB2Api, ...args),
    previewImageApi: (...args: Parameters<typeof previewImageApi>) =>
      $useApi(previewImageApi, ...args),
    previewTextApi: (...args: Parameters<typeof previewTextApi>) =>
      $useApi(previewTextApi, ...args),
    delObjApi,
    delDirApi,
    loginApi,
  };
}

function $useApi<T = any>(
  fn: (...args: any) => UseQueryResult<T>,
  ...args: Parameters<typeof fn>
) {
  const result = fn(...args);
  const { error, isFetching } = result;
  $useApiState(isFetching, error);

  return { ...result };
}
function $useApiState(isFetching: boolean, error: any) {
  const ctx = useStateContext();
  const nav = useNavigate();

  useEffect(() => {
    ctx.$setLoading(isFetching);
  }, [isFetching]);

  useEffect(() => {
    if (error instanceof UnauthorizedException) {
      nav("/login");
      return;
    }
    ctx.$setErr(error);
  }, [error]);
}
// function $useMutationApi<T = any>(
//   fn: (...args: any) => UseMutationResult<T>,
//   ...args: Parameters<typeof fn>
// ) {
//   const result = fn(...args);
//   const { error, isPending } = result;

//   $useApiState(isPending, error);

//   return { ...result };
// }

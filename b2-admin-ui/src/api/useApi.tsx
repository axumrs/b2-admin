import { $get } from "@/fetch";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useStateContext } from "@/contexts/StateContext";
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

  return {
    listB2Api: (...args: Parameters<typeof listB2Api>) =>
      $useApi(listB2Api, ...args),
    dirB2Api: (...args: Parameters<typeof dirB2Api>) =>
      $useApi(dirB2Api, ...args),
    previewImageApi: (...args: Parameters<typeof previewImageApi>) =>
      $useApi(previewImageApi, ...args),
    previewTextApi: (...args: Parameters<typeof previewTextApi>) =>
      $useApi(previewTextApi, ...args),
  };
}

function $useApi<T = any>(
  fn: (...args: any) => UseQueryResult<T>,
  ...args: Parameters<typeof fn>
) {
  const ctx = useStateContext();
  const nav = useNavigate();
  const result = fn(...args);
  const { error, isFetching } = result;
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

  return { ...result };
}

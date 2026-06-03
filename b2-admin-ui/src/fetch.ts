import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { FetchException, UnauthorizedException } from "./types/errs";

const defineConfig = (config: InternalAxiosRequestConfig) => {
  const authStr = sessionStorage.getItem("auth");
  const auth =
    authStr === "undefined"
      ? undefined
      : (JSON.parse(authStr || "") as JwtAuth);
  const selectedB2Str = sessionStorage.getItem("b2");
  const selectedB2 =
    selectedB2Str === "undefined"
      ? undefined
      : (JSON.parse(selectedB2Str || "") as B2Lite);
  config.headers["X-B2"] = selectedB2?.hash;
  config.headers.Authorization = auth ? `Bearer ${auth.token}` : undefined;
  config.headers["X-NONCE"] = auth ? `${auth.nonce}` : undefined;
  return config;
};

const $fetch = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

$fetch.interceptors.request.use(defineConfig);

const $blob_fetch = axios.create({
  ...$fetch.defaults,
  responseType: "blob",
});

$blob_fetch.interceptors.request.use(defineConfig);

const $json_fetch = axios.create({
  ...$fetch.defaults,
  responseType: "json",
});

$json_fetch.interceptors.request.use(defineConfig);
// $json_fetch.interceptors.response.use(
//   <T = any>(
//     resp: AxiosResponse<ApiReponse<T>>,
//   ): AxiosResponse<ApiReponse<T>> | Promise<AxiosResponse<ApiReponse<T>>> => {
//     const apiResp = resp.data;
//     if (apiResp.code !== 0) {
//       throw new FetchException(apiResp.msg);
//     }
//     return resp;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

type fetchConfig = AxiosRequestConfig & {};

const _fetch = <T = any>(url: string, config?: fetchConfig) => {
  return $json_fetch
    .request<ApiResponse<T>>({ url, ...config })
    .then((r) => {
      const apiResp = r.data;
      if (apiResp.code === 401) {
        throw new UnauthorizedException(apiResp.msg);
      }
      if (apiResp.code !== 0) {
        throw new FetchException(apiResp.msg);
      }
      return apiResp.data;
    })
    .catch((e) => {
      // if (e instanceof FetchException) {
      //   console.log("fetch exception", e.message);
      //   toast(e.message, { position: "top-center" });
      // } else if (e instanceof UnauthorizedException) {
      //   console.log("unauthorized exception", e.message);
      // } else if (e instanceof Error) {
      //   toast(e.message, { position: "top-center" });
      // } else {
      //   toast(`${e}`, { position: "top-center" });
      // }
      throw e;
    });
};

const $get = <T = any>(url: string, params?: any) =>
  _fetch<T>(url, { method: "GET", params });

const $del = <T = any>(url: string, params?: any) =>
  _fetch<T>(url, { method: "DELETE", params });

export { $json_fetch, $get, $blob_fetch, $del };

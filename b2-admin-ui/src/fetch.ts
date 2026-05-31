import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { FetchException, UnauthorizedException } from "./types/errs";

const defineConfig = (config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem("token");
  const selectedB2Str = sessionStorage.getItem("b2");
  const selectedB2 =
    selectedB2Str === "undefined"
      ? undefined
      : (JSON.parse(selectedB2Str || "") as B2Lite);
  config.headers["X-B2"] =
    selectedB2?.hash ||
    "e074509bb0f5873111d2c773c3f479d52b96dbce5ea7550853c4910fda8ac067";
  config.headers.Authorization = token ? `Bearer ${token}` : undefined;
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
export { $json_fetch, $get, $blob_fetch };

type ApiResponse<T> = {
  code: number;
  data: T;
  msg: string;
};
type ApiUpload = {
  chunk_index: number;
  total_chunks: number;
  file_id: string;
  prefix: string;
  original_name: string;
  chunk_len: number;
  is_last_chunk: boolean;
};

type JwtAuth = {
  token: string;
  nonce: string;
};

type ApiConfig = {
  site_key: string;
  upload_enable: boolean;
  upload_max_size: number;
  upload_chunk_size: number;
  download_enable: boolean;
  download_chunk_size: number;
  preview_text_enable: boolean;
  preview_image_enable: boolean;
  preview_text_max_size: number;
  preview_image_max_size: number;
  delete_enable: boolean;
};

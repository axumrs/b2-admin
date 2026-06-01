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

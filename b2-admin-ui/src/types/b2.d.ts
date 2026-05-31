type B2Lite = {
  hash: string;
  name: string;
};

type B2Dir = {
  path: string;
  sub_dirs: B2Dir[];
  file_list: B2File[];
  name: string;
};

type B2File = {
  path: string;
  size: number;
  mime: string;
  last_modified: string;
  ext_name: string;
  name: string;
};

import { useState } from "react";

export default function useMessage() {
  const [msg, setMsg] = useState<string>();

  return {
    msg,
    setMsg,
  };
}

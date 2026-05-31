import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import useApi from "@/api/useApi";
import { CheckIcon } from "@/components/Icons";

export default function SelectB2() {
  const [b2, setB2] = useState<B2Lite>();
  const { listB2Api } = useApi();
  const { data: b2List } = listB2Api();
  useEffect(() => {
    sessionStorage.setItem("b2", JSON.stringify(b2));
  }, [b2]);
  return (
    <>
      <div>请选择B2桶</div>
      <ul>
        {b2List?.map((item) => (
          <li key={item.hash}>
            <Toggle
              value={item.hash}
              //   pressed={true}
              onPressedChange={() => setB2(item)}
            >
              {item.name}
              <CheckIcon />
            </Toggle>
          </li>
        ))}
      </ul>
    </>
  );
}

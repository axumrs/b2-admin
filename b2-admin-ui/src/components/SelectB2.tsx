import { Toggle } from "@/components/ui/toggle";
import useApi from "@/api/useApi";
import { CheckIcon } from "@/components/Icons";
import { useStateContext } from "@/contexts/StateContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "./ui/button";

export function SelectB2({
  isDialog = false,
  onCompleted,
}: {
  isDialog?: boolean;
  onCompleted?: () => void;
}) {
  const { listB2Api } = useApi();
  const { data: b2List } = listB2Api();
  const { $setB2, $b2 } = useStateContext();

  return (
    <div className="space-y-6">
      {!isDialog && <div>请选择B2桶</div>}
      <ul>
        {b2List?.map((item) => (
          <li key={item.hash}>
            <Toggle
              value={item.hash}
              pressed={$b2?.hash === item.hash}
              onPressedChange={() => {
                $setB2(item);
              }}
            >
              {item.name}
              {$b2?.hash === item.hash && <CheckIcon />}
            </Toggle>
          </li>
        ))}
      </ul>
      <div
        className="flex justify-end"
        onClick={() => {
          onCompleted?.();
        }}
      >
        <Button>确定</Button>
      </div>
    </div>
  );
}

export default function SelectB2Dialog({
  children,
  onClose,
  show = false,
  ...props
}: {
  children: React.ReactNode;
  onClose?: () => void;
  show?: boolean;
} & React.ComponentProps<typeof SelectB2>) {
  const [open, setOpen] = useState(show);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          onClose?.();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>请选择B2桶</DialogTitle>
          <DialogDescription asChild>
            <div className="my-3">
              <SelectB2
                isDialog
                onCompleted={() => setOpen(false)}
                {...props}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

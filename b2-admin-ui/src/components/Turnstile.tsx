import React, { useMemo } from "react";
import { Turnstile as RCTurnstile } from "react-turnstile";
import { useTheme } from "./ThemeProvider";

export default function Turnstile({
  ...props
}: React.ComponentProps<typeof RCTurnstile>) {
  const { theme: SysTheme } = useTheme();
  const theme = useMemo(() => {
    if (SysTheme === "system") {
      return "auto";
    } else {
      return SysTheme;
    }
  }, [SysTheme]);
  return <RCTurnstile {...props} theme={theme} />;
}

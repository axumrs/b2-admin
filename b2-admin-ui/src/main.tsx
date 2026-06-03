import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { router } from "./router";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import { TooltipProvider } from "./components/ui/tooltip";
import StateContextProvider, {
  DefaultStateContextProps,
} from "./contexts/StateContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
  // queryCache: new QueryCache({
  //   onError: (error) => {
  //     if (error instanceof UnauthorizedException) {
  //       toast.error("请登录");
  //       return;
  //     }
  //     toast.error(error.message);
  //   },
  // }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="b2-admin-ui-theme">
      <StateContextProvider {...DefaultStateContextProps}>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </TooltipProvider>
      </StateContextProvider>
    </ThemeProvider>
  </StrictMode>,
);

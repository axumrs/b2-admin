import { createHashRouter as createRouter } from "react-router-dom";
import { lazy } from "react";

const Layout = lazy(() => import("@/components/Layout"));
const DirPage = lazy(() => import("@/pages/DirPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const LogoutPage = lazy(() => import("@/pages/LogoutPage"));

export const router = createRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DirPage />,
      },
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "logout",
    element: <LogoutPage />,
  },
]);

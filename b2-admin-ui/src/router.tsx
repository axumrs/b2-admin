import { createHashRouter as createRouter } from "react-router-dom";
import { lazy } from "react";

const Layout = lazy(() => import("@/components/Layout"));
const DirPage = lazy(() => import("@/pages/DirPage"));
const SelectB2Page = lazy(() => import("@/pages/SelectB2Page"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

export const router = createRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DirPage />,
      },
      {
        path: "select-b2",
        element: <SelectB2Page />,
      },
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
  },
]);

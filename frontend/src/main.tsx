import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import AuthInitializer from "@/shared/auth/AuthInitializer";
import "./chat-product-cards.css";

/**
 * main
 * - 앱 진입점
 * - AuthInitializer에서 앱 시작 시 인증 복구 후 라우터 렌더링
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  </React.StrictMode>,
);
import { createBrowserRouter, redirect, Outlet, Navigate } from "react-router-dom";
import { ROUTES } from "@/app/constants/routes";
import AppShell from "@/app/layout/AppShell";
import RequireAuth from "@/core/guards/RequireAuth";
import ErrorPage from "@/app/layout/ErrorPage";

import HomePage from "@/features/home/pages/HomePage";   // 샘플페이지
import LogsPage from "@/features/logs/pages/LogsPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import { me } from "@/features/auth/auth";

// 로그인되어 있으면 게스트 페이지 접근 시 /app 으로
async function redirectIfAuthed() {
    try {
        const user = await me();
        if (user) return redirect(ROUTES.app);
    } catch {}
    return null;
}

// 루트(/) 진입 시 분기
async function rootLoader() {
    try {
        const user = await me();
        return redirect(user ? ROUTES.app : ROUTES.login);
    } catch {
        return redirect(ROUTES.login);
    }
}

export const router = createBrowserRouter([
    // 루트 래퍼 (+ 에러바운더리)
    {
        path: ROUTES.root, // "/"
        element: <Outlet />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                loader: rootLoader,
                element: <div style={{ display: "none" }} />, // 리다이렉트만 수행
            },
        ],
    },

    // 게스트 라우트 (+ 에러바운더리)
    { path: ROUTES.login, element: <LoginPage />, loader: redirectIfAuthed, errorElement: <ErrorPage /> },
    { path: ROUTES.signup, element: <SignupPage />, loader: redirectIfAuthed, errorElement: <ErrorPage /> },

    // 보호 라우트 /app (+ 에러바운더리)
    {
        path: ROUTES.app, // "/app"
        element: <AppShell />,
        errorElement: <ErrorPage />,
        children: [
            {
                element: <RequireAuth />,
                children: [
                    { index: true, element: <Navigate to="logs" replace /> }, // /app → /app/logs
                    { path: "logs", element: <LogsPage /> },
                    { path: "sample", element: <HomePage /> },                // /app/sample
                    { path: "*", element: <ErrorPage status={404} /> },       // /app 하위 404
                ],
            },
        ],
    },

    // 앱 전체 최종 404
    { path: "*", element: <ErrorPage status={404} /> },
]);
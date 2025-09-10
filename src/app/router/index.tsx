import { createBrowserRouter, redirect, Outlet } from "react-router-dom";
import { JSX, lazy, Suspense } from "react";
import { ROUTES } from "@/app/constants/routes";
import AppShell from "@/app/layout/AppShell";
import ErrorPage from "@/app/layout/ErrorPage";
import { me } from "@/features/auth/auth";

// --- Lazy pages (코드 스플리팅)
const LoginPage  = lazy(() => import("@/features/auth/pages/LoginPage"));
const SignupPage = lazy(() => import("@/features/auth/pages/SignupPage"));
const LogsPage   = lazy(() => import("@/features/logs/pages/LogsPage"));
const HomePage   = lazy(() => import("@/features/home/pages/HomePage"));
const UsersPage  = lazy(() => import("@features/admin/pages/UsersPage"));

// 공통 Suspense 래퍼
const S = (el: JSX.Element) => <Suspense fallback={<div/>}>{el}</Suspense>;

// --- 로더: 인증/게스트 분기
async function requireAuthed() {
    const user = await me().catch(() => null);
    if (!user) throw redirect(ROUTES.login);
    return user;
}

async function requireGuest() {
    const user = await me().catch(() => null);
    if (user) throw redirect(ROUTES.app);
    return null;
}

async function rootLoader() {
    const user = await me().catch(() => null);
    throw redirect(user ? ROUTES.app : ROUTES.login);
}

export const router = createBrowserRouter(
    [
        // 루트 엔트리: / → 로그인 또는 /app 로 리다이렉트
        {
            path: ROUTES.root,
            element: <Outlet />,
            errorElement: <ErrorPage />,
            children: [
                {
                    index: true,
                    loader: rootLoader,
                    element: <div style={{ display: "none" }} />, // 로더가 즉시 redirect
                },
            ],
        },

        // 게스트 라우트
        { path: ROUTES.login,  loader: requireGuest, element: S(<LoginPage />),  errorElement: <ErrorPage /> },
        { path: ROUTES.signup, loader: requireGuest, element: S(<SignupPage />), errorElement: <ErrorPage /> },

        // 보호 라우트: 부모(/app) 로더에서 인증 선검증
        {
            path: ROUTES.app,
            element: <AppShell />,
            loader: requireAuthed,         // 부모에서 인증 선검증
            shouldRevalidate: () => true,  // 자식 전환 포함 항상 재검증
            errorElement: <ErrorPage />,
            children: [
                { index: true, loader: () => redirect("logs"), element: <div /> }, // /app → /app/logs

                // 기능 페이지들
                { path: "logs",        loader: requireAuthed, element: S(<LogsPage />) },
                { path: "sample",      loader: requireAuthed, element: S(<HomePage />) },

                // ★ 사용자 관리
                { path: "admin/users", loader: requireAuthed, element: S(<UsersPage />) },

                { path: "*", element: <ErrorPage status={404} /> },
            ],
        },

        // 앱 전체 최종 404
        { path: "*", element: <ErrorPage status={404} /> },
    ],
    {
        // 서브경로 배포 시 유용 (Vite의 BASE_URL과 연동)
        basename: import.meta.env.BASE_URL,
    }
);

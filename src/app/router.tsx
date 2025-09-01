import { createBrowserRouter, redirect } from "react-router-dom";
import AppShell from "@/AppShell";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import RequireAuth from "@/components/RequireAuth";
import { me } from "@/api/auth";
import LogsPage from "@/pages/LogsPage";
import HomePage from "@/pages/HomePage.tsx";

const NotFound = () => <div className="p-6">Not Found</div>;

async function isAuthed() {
    try {
        const u = await me();
        return !!u;
    } catch {
        return false;
    }
}

export const router = createBrowserRouter([
    // 로그인 경로들: "/"와 "/login" 둘 다 지원
    {
        path: "/",
        element: <LoginPage />,
        // ✅ 이미 로그인 상태면 바로 로그조회로
        loader: async () => (await isAuthed() ? redirect("/app/logs") : null),
    },
    {
        path: "/login",
        element: <LoginPage />,
        loader: async () => (await isAuthed() ? redirect("/app/logs") : null),
    },

    // 회원가입
    {
        path: "/signup",
        element: <SignupPage />,
        loader: async () => (await isAuthed() ? redirect("/app/logs") : null),
    },

    // 보호 구역: /app 이하
    {
        path: "/app",
        element: <RequireAuth />,
        children: [
            {
                element: <AppShell />,
                children: [
                    // 인덱스(기본) 화면을 LogsPage로
                    { index: true, element: <LogsPage /> },
                    // 명시 경로도 지원
                    { path: "logs", element: <LogsPage /> },

                    // 필요 시 다른 화면들 여기 추가
                    { path: "sample", element: <HomePage /> },

                    { path: "*", element: <NotFound /> },
                ],
            },
        ],
    },

    { path: "*", element: <NotFound /> },
]);
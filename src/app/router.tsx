import { createBrowserRouter, redirect } from "react-router-dom";
import AppShell from "@/AppShell";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RequireAuth from "@/components/RequireAuth";
import { me } from "@/api/auth";

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
        loader: async () => (await isAuthed() ? redirect("/app") : null),
    },
    {
        path: "/login",
        element: <LoginPage />,
        loader: async () => (await isAuthed() ? redirect("/app") : null),
    },

    // 보호 구역: /app 이하
    {
        path: "/app",
        element: <RequireAuth />,
        children: [
            {
                element: <AppShell />,
                children: [
                    { index: true, element: <HomePage /> },
                    { path: "*", element: <NotFound /> },
                ],
            },
        ],
    },

    { path: "*", element: <NotFound /> },
]);
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, me } from "@/features/auth/auth";
import Sidebar from "@/app/layout/Sidebar";

export default function AppShell() {
    const [open, setOpen] = useState(true);
    const { pathname } = useLocation();
    const nav = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    // 사이드바 열림상태 저장/복원
    useEffect(() => {
        const v = localStorage.getItem("sidebar.open");
        if (v !== null) setOpen(v === "1");
    }, []);
    useEffect(() => {
        localStorage.setItem("sidebar.open", open ? "1" : "0");
    }, [open]);

    // 사용자 표시
    useEffect(() => {
        (async () => {
            try {
                const u = await me();
                setUsername(u?.username ?? null);
            } catch {
                setUsername(null);
            }
        })();
    }, []);

    // /app 하위에 있을 때만 의미 — 현재 구조에선 항상 true
    const isApp = pathname === "/app" || pathname.startsWith("/app/");

    return (
        <div
            className="h-screen w-screen grid"
            style={{ gridTemplateColumns: `${open ? "224px" : "56px"} 1fr`, gridTemplateRows: "56px 1fr" }}
        >
            {/* Sidebar */}
            <aside className="row-span-2 bg-slate-900 text-slate-100 transition-all duration-200">
                <div className="p-2">
                    <button
                        className="w-full h-9 mb-2 text-xs rounded border border-slate-300 hover:bg-slate-100"
                        onClick={() => setOpen(o => !o)}
                        title={open ? "사이드바 접기" : "사이드바 펼치기"}
                    >
                        {open ? "◀  메뉴 접기" : "▶"}
                    </button>

                    {/* 열림 상태일 때 전체 메뉴 보여주기 */}
                    {open ? (
                        <Sidebar />
                    ) : (
                        // 접힘 상태에서는 공간만 유지 (필요하면 아이콘 전용 메뉴로 확장 가능)
                        <nav aria-label="collapsed sidebar" className="flex flex-col gap-1 px-1 text-xs text-slate-500">
                            {isApp ? <span className="px-1">…</span> : null}
                        </nav>
                    )}
                </div>
            </aside>

            {/* Topbar */}
            <header className="border-b border-slate-200 flex items-center justify-between px-4 bg-slate-800 text-white">
                <div className="text-sm font-semibold">NGW Admin Console</div>
                <div className="flex items-center gap-3">
                    {username && <span className="text-xs opacity-90">👋 {username}</span>}
                    <span className="text-xs opacity-80">관리자</span>
                    <button
                        type="button"
                        disabled={loggingOut}
                        onClick={async () => {
                            try {
                                setLoggingOut(true);
                                await logout();
                            } finally {
                                setLoggingOut(false);
                                nav("/login", { replace: true });
                            }
                        }}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded disabled:opacity-50"
                    >
                        {loggingOut ? "로그아웃 중..." : "로그아웃"}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 overflow-auto bg-slate-50">
                <Outlet />
            </main>
        </div>
    );
}
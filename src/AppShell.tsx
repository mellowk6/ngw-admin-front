import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, me } from "@/api/auth";

export default function AppShell() {
    const [open, setOpen] = useState(true);
    const { pathname } = useLocation();
    const nav = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const v = localStorage.getItem("sidebar.open");
        if (v !== null) setOpen(v === "1");
    }, []);
    useEffect(() => {
        localStorage.setItem("sidebar.open", open ? "1" : "0");
    }, [open]);

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

    const isApp = pathname === "/app" || pathname.startsWith("/app/"); // ← 실제 사용

    return (
        <div
            className="h-screen w-screen grid"
            style={{ gridTemplateColumns: `${open ? "220px" : "56px"} 1fr`, gridTemplateRows: "56px 1fr" }}
        >
            {/* Sidebar */}
            <aside className="row-span-2 bg-slate-900 text-slate-100 transition-all duration-200">
                <div className="p-2">
                    <button
                        className="w-full h-9 mb-2 text-xs rounded border border-slate-700 hover:bg-slate-800"
                        onClick={() => setOpen(o => !o)}
                        title={open ? "사이드바 접기" : "사이드바 펼치기"}
                    >
                        {open ? "◀  메뉴 접기" : "▶"}
                    </button>
                    <nav className="flex flex-col gap-1">
                        <Link
                            to="/app"
                            className={[
                                "px-3 py-2 rounded text-sm",
                                isApp ? "bg-slate-700 text-white" : "hover:bg-slate-800 text-slate-200",
                                "transition-colors",
                            ].join(" ")}
                            title="홈"
                        >
                            {open ? "홈" : "홈"[0]}
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Topbar (위와 동일) */}
            <header className="border-b border-slate-200 flex items-center justify-between px-4 bg-slate-800 text-white">
                <div className="text-sm font-semibold">Admin Console</div>
                <div className="flex items-center gap-3">
                    {username && <span className="text-xs opacity-90">👋 {username}</span>}
                    <span className="text-xs opacity-80">v0.1.0</span>
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

            <main className="p-4 overflow-auto bg-slate-50">
                <Outlet />
            </main>
        </div>
    );
}
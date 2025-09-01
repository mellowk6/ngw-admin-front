import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "@/api/auth";

export default function LoginPage() {
    const nav = useNavigate();
    const loc = useLocation() as any;

    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [showPw, setShowPw] = useState(false); // 비밀번호 표시 토글
    const [capsOn, setCapsOn] = useState(false); // CapsLock 경고
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            await login(username.trim(), password);
            const to = loc?.state?.from?.pathname ?? "/app";
            nav(to, { replace: true });
        } catch (e: any) {
            // auth.ts에서 넣어준 e.status(401 등)를 우선 사용
            const status = typeof e?.status === "number" ? e.status : 0;
            if (status === 401) {
                setErr("아이디 또는 비밀번호를 확인하세요.");
            } else {
                setErr("로그인 실패");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-slate-100">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4 border"
            >
                <h1 className="text-xl font-semibold">NGW Admin 로그인</h1>

                <div className="space-y-1">
                    <label className="text-sm">아이디</label>
                    <input
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={username}
                        onChange={(e) => setU(e.target.value)}
                        placeholder="username"
                        autoComplete="username"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm">비밀번호</label>
                    <div className="relative">
                        <input
                            type={showPw ? "text" : "password"}
                            className="w-full rounded-lg border px-3 py-2 text-sm pr-20"
                            value={password}
                            onChange={(e) => setP(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            onKeyDown={(e) =>
                                setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))
                            }
                            onKeyUp={(e) =>
                                setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))
                            }
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 border rounded bg-slate-50 hover:bg-slate-100"
                            onClick={() => setShowPw((s) => !s)}
                            aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                        >
                            {showPw ? "숨김" : "표시"}
                        </button>
                    </div>
                    {capsOn && (
                        <p className="text-xs text-amber-600 mt-1">
                            Caps Lock이 켜져 있습니다.
                        </p>
                    )}
                </div>

                {err && <p className="text-sm text-rose-600">{err}</p>}

                {/* 버튼 영역 */}
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm disabled:opacity-50"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/signup")}
                        className="rounded-lg border border-slate-300 text-slate-700 py-2 px-4 text-sm hover:bg-slate-50"
                    >
                        회원가입
                    </button>
                </div>
            </form>
        </div>
    );
}
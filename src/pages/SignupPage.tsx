import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "@/api/auth";

type Dept = { code: string; name: string };

// 공통 GET JSON 헬퍼 (쿠키 포함)
async function getJson<T>(url: string): Promise<T> {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) throw new Error(`요청 실패 (HTTP ${r.status})`);
    return r.json();
}

export default function SignupPage() {
    const nav = useNavigate();

    // 폼 상태
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [company, setCompany] = useState("");
    const [deptCode, setDeptCode] = useState("");

    // 부가 상태
    const [depts, setDepts] = useState<Dept[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);

    const [checkingId, setCheckingId] = useState(false);
    const [idAvailable, setIdAvailable] = useState<null | boolean>(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allFilled = useMemo(
        () =>
            userId.trim() &&
            password.trim() &&
            displayName.trim() &&
            company.trim() &&
            deptCode.trim(),
        [userId, password, displayName, company, deptCode]
    );

    // 부서 목록 불러오기
    useEffect(() => {
        (async () => {
            try {
                const list = await getJson<Dept[]>("/api/dept/list");
                setDepts(list || []);
            } catch {
                setDepts([]);
            } finally {
                setLoadingDepts(false);
            }
        })();
    }, []);

    // 아이디 중복 확인
    async function handleCheckId() {
        try {
            setError(null);
            setCheckingId(true);
            const j = await getJson<{ available: boolean }>(
                `/api/auth/check-id?userId=${encodeURIComponent(userId.trim())}`
            );
            setIdAvailable(!!j?.available);
            if (!j?.available) setError("이미 사용 중인 아이디입니다.");
        } catch {
            setIdAvailable(null);
            setError("ID 중복 확인 중 오류가 발생했습니다.");
        } finally {
            setCheckingId(false);
        }
    }

    // 값이 바뀌면 다시 중복확인 필요
    useEffect(() => {
        setIdAvailable(null);
    }, [userId]);

    // 제출
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!allFilled) {
            setError("모든 항목을 입력해주세요.");
            return;
        }
        if (idAvailable !== true) {
            setError("아이디 중복 확인을 먼저 진행해주세요.");
            return;
        }

        try {
            setSubmitting(true);
            await signup({
                username: userId.trim(),      // 사번 입력
                password: password.trim(),
                displayName: displayName.trim(),
                department: deptCode.trim(),
                company: company.trim(),
            });
            alert("가입이 완료되었습니다. 로그인 화면으로 이동합니다.");
            nav("/");
        } catch (e: any) {
            setError(e?.message || "가입 처리 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-slate-100 p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-5 border"
            >
                <h1 className="text-2xl font-bold">회원가입</h1>

                {/* 사용자 ID (사번) + 중복확인 */}
                <div>
                    <label className="block text-sm font-medium mb-1">사용자ID (사번) *</label>
                    <div className="flex gap-2">
                        <input
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="사번을 입력하세요"
                            className="flex-1 h-11 rounded-xl border px-3 text-sm"
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={handleCheckId}
                            disabled={!userId.trim() || checkingId}
                            className="h-11 px-4 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                            {checkingId ? "확인중..." : "중복확인"}
                        </button>
                    </div>
                    {idAvailable === true && (
                        <p className="text-xs text-green-600 mt-1">사용 가능한 아이디입니다.</p>
                    )}
                    {idAvailable === false && (
                        <p className="text-xs text-rose-600 mt-1">이미 사용 중인 아이디입니다.</p>
                    )}
                </div>

                {/* 사용자명 */}
                <div>
                    <label className="block text-sm font-medium mb-1">사용자명 *</label>
                    <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="홍길동"
                        className="w-full h-11 rounded-xl border px-3 text-sm"
                        autoComplete="name"
                    />
                </div>

                {/* 회사명 */}
                <div>
                    <label className="block text-sm font-medium mb-1">회사명 *</label>
                    <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="회사명을 입력하세요"
                        className="w-full h-11 rounded-xl border px-3 text-sm"
                        autoComplete="organization"
                    />
                </div>

                {/* 부서정보 (리스트박스) */}
                <div>
                    <label className="block text-sm font-medium mb-1">부서정보 *</label>
                    <select
                        value={deptCode}
                        onChange={(e) => setDeptCode(e.target.value)}
                        className="w-full h-11 rounded-xl border px-3 text-sm bg-white"
                        disabled={loadingDepts}
                    >
                        <option value="">{loadingDepts ? "불러오는 중..." : "부서를 선택하세요"}</option>
                        {depts.map((d) => (
                            <option key={d.code} value={d.code}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 비밀번호 */}
                <div>
                    <label className="block text-sm font-medium mb-1">비밀번호 *</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호"
                        className="w-full h-11 rounded-xl border px-3 text-sm"
                        autoComplete="new-password"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                        * 모든 Text 필드는 필수 입력입니다.
                    </p>
                </div>

                {/* 오류 */}
                {error && (
                    <div className="rounded-lg bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={!allFilled || idAvailable !== true || submitting}
                        className="h-11 px-6 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting ? "신청중..." : "신청"}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav("/")}
                        className="h-11 px-6 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}
import { apiFetch, resetCsrf } from "@core/http/client";

// 회원가입 요청 필드
export interface SignupRequest {
    username: string;     // 사용자ID (사번)
    password: string;     // 비밀번호
    displayName: string;  // 사용자명
    department: string;   // 부서코드
    company: string;      // 회사명
}

export type Me = { username: string; roles: string[] };

/** (선택) 로그인 페이지 진입 시 미리 CSRF 쿠키 받아두기 */
export async function prefetchCsrf(): Promise<void> {
    // apiFetch는 GET에 CSRF를 붙이지 않지만, 쿠키 세팅을 위해 호출
    await apiFetch("/api/auth/csrf", { method: "GET" });
}

export async function login(username: string, password: string): Promise<true> {
    const r = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok) {
        const text = await r.text().catch(() => "");
        const err: any = new Error(text || `HTTP ${r.status}`);
        err.status = r.status;
        throw err;
    }
    return true;
}

export async function logout(): Promise<void> {
    const r = await apiFetch("/api/auth/logout", { method: "POST" });
    if (r.status !== 200 && r.status !== 204) {
        const text = await r.text().catch(() => "");
        throw new Error(text || `로그아웃 실패 (HTTP ${r.status})`);
    }
    // 다음 요청에서 CSRF 재발급되도록 초기화
    resetCsrf();
}

export async function me(): Promise<Me | null> {
    const r = await apiFetch("/api/me");
    if (r.status === 401) return null;
    if (!r.ok) throw new Error(`me 실패 (HTTP ${r.status})`);
    return r.json();
}

export async function signup(data: SignupRequest): Promise<true> {
    const r = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!r.ok) {
        const msg = await r.text().catch(() => "");
        throw new Error(msg || `회원가입 실패 (HTTP ${r.status})`);
    }
    return true;
}
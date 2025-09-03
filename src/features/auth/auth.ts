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
    // apiFetch는 GET에 CSRF를 붙이지 않지만, 쿠키 세팅만 해두면 됨
    try {
        await apiFetch("/api/auth/csrf");
    } catch {
        // 사일런트: 실패해도 이후 POST 시 ensureCsrf가 다시 처리함
    }
}

export async function login(username: string, password: string): Promise<true> {
    await apiFetch<{ ok: boolean }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return true;
}

export async function logout(): Promise<void> {
    await apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    // 다음 요청에서 CSRF 재발급되도록 초기화
    resetCsrf();
}

export async function me(): Promise<Me | null> {
    try {
        return await apiFetch<Me>("/api/me");
    } catch (e: any) {
        if (e?.status === 401) return null; // 비로그인: 정상 흐름
        throw e;                             // 그 외 오류는 그대로 전파
    }
}

export async function signup(data: SignupRequest): Promise<true> {
    await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return true;
}
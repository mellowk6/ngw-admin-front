import { apiFetch, resetCsrf } from "@core/http/client";
import { STORAGE_KEYS } from "@/app/constants/storageKeys";
import { API } from "@app/constants/apiPaths";

/** 회원가입 요청 필드 (신 스키마) */
export interface SignupRequest {
    id: string;        // 로그인 아이디
    password: string;  // 비밀번호(평문 전송 → 서버에서 해시)
    name: string;      // 사용자명
    deptCode: string;  // 부서코드
    company: string;   // 회사명
}

/** 내 정보 응답 (백엔드 /api/user/my-info 에 맞춤) */
export type Me = { id: string; roles: string[] };

/** (선택) 로그인 페이지 진입 시 CSRF 쿠키 미리 확보 */
export async function prefetchCsrf(): Promise<void> {
    try {
        await apiFetch("/api/auth/csrf");
    } catch {
        // 실패해도 이후 POST 시 ensureCsrf가 처리
    }
}

/** 로그인 */
export async function login(id: string, password: string): Promise<true> {
    await apiFetch<{ ok: boolean }>(API.user.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }), // ← username 아님!
    });
    localStorage.setItem(STORAGE_KEYS.authFlag, "1");
    return true;
}

/** 로그아웃 */
export async function logout(): Promise<void> {
    await apiFetch<{ ok: boolean }>(API.user.logout, { method: "POST" });
    localStorage.removeItem(STORAGE_KEYS.authFlag);
    resetCsrf();
}

/** 내 정보 */
export async function me(): Promise<Me | null> {
    try {
        return await apiFetch<Me>(API.user.myInfo);
    } catch (e: any) {
        if (e?.status === 401) return null;
        throw e;
    }
}

/** 회원가입 */
export async function signup(data: SignupRequest): Promise<true> {
    await apiFetch(API.user.signup, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), // { id, password, name, deptCode, company }
    });
    return true;
}

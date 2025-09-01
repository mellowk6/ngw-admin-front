let csrfHeader = "X-XSRF-TOKEN";
let csrfToken: string | null = null;

// 회원가입 요청 필드 정의
export interface SignupRequest {
    username: string;     // 사용자ID (사번)
    password: string;     // 비밀번호
    displayName: string;  // 사용자명
    department: string;   // 부서코드
    company: string;      // 회사명
}

async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const r = await fetch("/api/auth/csrf", { credentials: "include" });
    if (!r.ok) throw new Error("CSRF 토큰 획득 실패");
    const j = await r.json();
    csrfHeader = j.headerName ?? "X-XSRF-TOKEN";
    csrfToken = j.token;
    return csrfToken!;
}

export async function login(username: string, password: string) {
    await ensureCsrf();
    const r = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            [csrfHeader]: csrfToken as string,
        },
        body: JSON.stringify({ username, password }),
    });

    if (!r.ok) {
        // 본문이 비어있을 수 있으니 안전하게 읽고 상태코드 포함해 던짐
        const text = await r.text().catch(() => "");
        const err: any = new Error(text || `HTTP ${r.status}`);
        err.status = r.status;           // ← 상태코드 전달
        throw err;
    }
    return true;
}

export async function logout() {
    await ensureCsrf();
    const r = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { [csrfHeader]: csrfToken as string },
    });
    if (!r.ok) throw new Error(`로그아웃 실패 (HTTP ${r.status})`);
    csrfToken = null;
}

export async function me(): Promise<{ username: string; roles: string[] } | null> {
    const r = await fetch("/api/me", { credentials: "include" });
    if (r.status === 401) return null;
    if (!r.ok) throw new Error(`me 실패 (HTTP ${r.status})`);
    return r.json();
}

export async function signup(data: SignupRequest): Promise<boolean> {
    await ensureCsrf();
    const r = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            [csrfHeader]: csrfToken as string,
        },
        body: JSON.stringify(data),
    });
    if (!r.ok) {
        const msg = await r.text().catch(() => "");
        throw new Error(msg || `회원가입 실패 (HTTP ${r.status})`);
    }
    return true;
}
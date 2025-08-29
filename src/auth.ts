// src/auth.ts
let csrfHeader = "X-XSRF-TOKEN";
let csrfToken: string | null = null;

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
    if (!r.ok) throw new Error("로그인 실패");
    return true;
}

export async function logout() {
    await ensureCsrf();
    const r = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { [csrfHeader]: csrfToken as string },
    });
    if (!r.ok) throw new Error("로그아웃 실패");
    csrfToken = null;
}

export async function me(): Promise<{ username: string; roles: string[] } | null> {
    const r = await fetch("/api/me", { credentials: "include" });
    if (r.status === 401) return null;
    if (!r.ok) throw new Error("me 조회 실패");
    return r.json();
}
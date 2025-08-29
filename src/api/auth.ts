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
    if (!r.ok) {
        // 본문이 비어있을 수 있으니 text로 안전하게 읽고 에러로 던짐
        const msg = await r.text().catch(() => "");
        throw new Error(msg || `로그인 실패 (HTTP ${r.status})`);
    }
    // ✅ 성공해도 본문 파싱 안 함 (true만 반환)
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
    return r.json(); // me는 JSON이므로 OK
}
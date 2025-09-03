// 쿠키 포함 및 CSRF 자동 적용용 래퍼
let csrfHeader = 'X-XSRF-TOKEN';
let csrfToken: string | null = null;

async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const r = await fetch('/api/auth/csrf', { credentials: 'include' });
    const j = await r.json();
    csrfHeader = j.headerName ?? 'X-XSRF-TOKEN';
    csrfToken = j.token;
    return csrfToken!;
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
    // 모든 요청에 쿠키 포함
    const baseInit: RequestInit = { credentials: 'include', ...init };

    // 변경 요청(POST/PUT/PATCH/DELETE)에만 CSRF 헤더 자동 추가
    const method = (baseInit.method ?? 'GET').toUpperCase();
    if (['POST','PUT','PATCH','DELETE'].includes(method)) {
        const token = await ensureCsrf();
        baseInit.headers = {
            ...(baseInit.headers || {}),
            [csrfHeader]: token,
        };
    }
    return fetch(input, baseInit);
}

// 필요 시 강제 리프레시(로그아웃 뒤 등)
export function resetCsrf() { csrfToken = null; }
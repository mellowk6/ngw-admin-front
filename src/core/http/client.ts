// src/core/http/client.ts
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

/** ✅ 제네릭 반환: ApiResponse<T>면 data만 언래핑해서 T로 돌려줌 */
export async function apiFetch<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<T> {
    const baseInit: RequestInit = { credentials: 'include', ...init };

    const headers = new Headers(baseInit.headers || {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    const method = (baseInit.method ?? 'GET').toString().toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const token = await ensureCsrf();
        headers.set(csrfHeader, token);
    }
    baseInit.headers = headers;

    const res = await fetch(input, baseInit);

    if (res.status === 204) return undefined as unknown as T;

    const raw = await res.text();
    if (!raw) {
        if (!res.ok) throw buildHttpError(res.status);
        return undefined as unknown as T;
    }

    let json: any;
    try {
        json = JSON.parse(raw);
    } catch {
        if (!res.ok) throw buildHttpError(res.status, raw);
        return raw as unknown as T;
    }

    if (!res.ok) {
        const message = json?.message || json?.error || `HTTP ${res.status}`;
        const err = buildHttpError(res.status, message);
        (err as any).body = json;
        throw err;
    }

    // ApiResponse<T> 자동 언래핑
    if (json && typeof json === 'object' && 'data' in json) {
        return json.data as T;
    }
    return json as T;
}

function buildHttpError(status: number, message?: string) {
    const err = new Error(message ?? `HTTP ${status}`);
    (err as any).status = status;
    return err;
}

export function resetCsrf() {
    csrfToken = null;
}

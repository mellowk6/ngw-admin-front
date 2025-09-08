import { STORAGE_KEYS } from "@/app/constants/storageKeys"; // ★ authFlag 사용

let csrfHeader = "X-XSRF-TOKEN";
let csrfToken: string | null = null;
let redirecting401 = false; // ★ 중복 redirect 방지

async function ensureCsrf() {
    if (csrfToken) return csrfToken;
    const r = await fetch("/api/auth/csrf", { credentials: "include" });
    const j = await r.json();
    csrfHeader = j.headerName ?? "X-XSRF-TOKEN";
    csrfToken = j.token;
    return csrfToken!;
}

/** ✅ 제네릭 반환: ApiResponse<T>면 data만 언래핑해서 T로 돌려줌 */
export async function apiFetch<T = unknown>(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<T> {
    const baseInit: RequestInit = { credentials: "include", ...init };

    const headers = new Headers(baseInit.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const method = (baseInit.method ?? "GET").toString().toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const token = await ensureCsrf();
        headers.set(csrfHeader, token);
    }
    baseInit.headers = headers;

    const res = await fetch(input, baseInit);

    // === 401 공통 처리 (무한루프 방지 포함) ===
    if (res.status === 401) {
        const reqUrl =
            typeof input === "string"
                ? input
                : (input as any)?.url ?? input.toString();
        const path = new URL(reqUrl, window.location.origin).pathname;

        const onLoginPage = window.location.pathname.startsWith("/login");
        const isAuthApi = path.startsWith("/api/auth/");
        const shouldRedirect = !isAuthApi && !onLoginPage && !redirecting401;

        let msg = "세션이 만료되었습니다. 다시 로그인 해주세요.";
        try {
            const j = await res.clone().json();
            if (j?.message) msg = j.message;
        } catch {
            /* ignore */
        }

        if (shouldRedirect) {
            if (localStorage.getItem(STORAGE_KEYS.authFlag) === "1") {
                alert(msg);
            }
            // 세션 흔적 정리
            localStorage.removeItem(STORAGE_KEYS.authFlag);
            resetCsrf();

            redirecting401 = true; // ★ 중복 실행 방지
            window.location.replace("/login");
        }

        const err: any = new Error(msg);
        err.status = 401;
        throw err;
    }
    // =====================================

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
    if (json && typeof json === "object" && "data" in json) {
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

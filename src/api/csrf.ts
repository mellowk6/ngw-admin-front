export async function prefetchCsrf(): Promise<void> {
    await fetch("/api/auth/csrf", { credentials: "include" }); // XSRF-TOKEN 쿠키 세팅
}

// 쿠키의 XSRF-TOKEN 값을 꺼내 헤더로 붙임
export function csrfHeaders(): Record<string, string> {
    const token = document.cookie
        .split("; ")
        .find((c) => c.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];
    return token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {};
}
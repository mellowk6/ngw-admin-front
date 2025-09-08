export const STORAGE_KEYS = {
    xsrfCookie: "XSRF-TOKEN",
    sessionCookie: "ADMIN_SESSION", // 서버 설정에 맞춤
    authFlag: "auth.loggedin",      // ★ 로그인 성공 시 set, 401 처리 시 remove
} as const;
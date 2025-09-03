export const API = {
    auth: {
        csrf: "/api/auth/csrf",
        login: "/api/auth/login",
        logout: "/api/auth/logout",
        me: "/api/me",
        checkId: "/api/auth/check-id",
        signup: "/api/auth/signup",
    },
    logs: {
        list: "/api/logs",
        loggers: "/api/logs/loggers",
        guids: "/api/logs/guids",
    },
} as const;
export const API = {
    auth: {
        csrf: "/api/auth/csrf"
    },
    user: {
        login: "/api/user/login",
        logout: "/api/user/logout",
        myInfo: "/api/user/my-info",
        checkId: "/api/user/check-id",
        signup: "/api/user/signup",
        dept: {
            list: "/api/user/dept/list"
        },
    },
    logs: {
        list: "/api/logs",
        loggers: "/api/logs/loggers",
        guids: "/api/logs/guids",
    },
} as const;
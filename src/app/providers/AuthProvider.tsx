import React, { createContext, useContext, useEffect, useState } from "react";
import * as Auth from "@/features/auth/auth";

// auth.ts 의 me() 반환 타입 정의
export type MeResponse = { username: string; roles: string[] } | null;

type AuthState = {
    user: MeResponse;
    loading: boolean;
    login: (u: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<MeResponse>(null);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const m = await Auth.me();
            setUser(m);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const login = async (username: string, password: string) => {
        await Auth.login(username, password);
        await refresh();
    };

    const logout = async () => {
        await Auth.logout();
        setUser(null);
    };

    return (
        <Ctx.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </Ctx.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
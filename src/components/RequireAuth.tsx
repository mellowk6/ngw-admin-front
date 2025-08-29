import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { me } from "@/api/auth";   // ✅ /api/me 호출

export default function RequireAuth() {
    const loc = useLocation();
    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const user = await me();
                setAuthed(!!user);
            } catch {
                setAuthed(false);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <div className="p-6">인증 확인 중...</div>;
    }

    if (!authed) {
        return <Navigate to="/login" replace state={{ from: loc }} />;
    }

    return <Outlet />;
}
import { apiFetch } from "@core/http/client";

/** 단일 사용자 행 타입 (그리드에 표시되는 컬럼 그대로) */
export type UserRow = {
    userId: string;
    userName: string;
    deptName: string;
    companyName: string;
    role: string;
    joinedAt: string;   // ISO or yyyy-MM-dd
    updatedAt: string;  // ISO or yyyy-MM-dd
};

/** 조회 요청 파라미터 */
export type UserSearch = {
    page?: number;
    size?: number;
    userId?: string;
    userName?: string;
    role?: string;
    deptName?: string;
    companyName?: string;
};

/** 공통 페이지 응답 */
export type Page<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;     // current page (0-base)
};

/** 사용자 목록 조회 */
export async function fetchUsers(q: UserSearch): Promise<Page<UserRow>> {
    const p = new URLSearchParams();
    if (q.page != null) p.set("page", String(q.page));
    if (q.size != null) p.set("size", String(q.size));
    if (q.userId) p.set("userId", q.userId);
    if (q.userName) p.set("userName", q.userName);
    if (q.role) p.set("role", q.role);
    if (q.deptName) p.set("deptName", q.deptName);
    if (q.companyName) p.set("companyName", q.companyName);

    return apiFetch<Page<UserRow>>(`/api/users?${p.toString()}`);
}

/** 사용자 단건 업데이트 (그리드에서 편집한 1행 적용) */
export async function updateUser(row: Partial<UserRow> & { userId: string }): Promise<true> {
    await apiFetch(`/api/users/${encodeURIComponent(row.userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
    });
    return true;
}

/** 권한/부서 셀렉트 옵션 */
export type SimpleOption = { value: string; label: string };

export async function fetchRoleOptions(): Promise<SimpleOption[]> {
    // 필요 시 /api/roles 같은 엔드포인트로 교체 가능
    return [
        { value: "Admin", label: "Admin" },
        { value: "User", label: "User" },
        { value: "Auditor", label: "Auditor" },
    ];
}

/** 부서 목록 조회 (DB 기반) */
type Dept = { code: string; name: string };

export async function fetchDeptOptions(): Promise<SimpleOption[]> {
    const list = await apiFetch<Dept[]>("/api/dept/list");
    return (list ?? []).map((d) => ({ value: d.code, label: d.name }));
}

// src/features/admin/users.ts
import { apiFetch } from "@core/http/client";
import { API } from "@/app/constants/apiPaths";

/** 화면에서 쓰는 행 타입 */
export type UserRow = {
    userId: string;     // id
    userName: string;   // name
    deptCode: string;   // deptCode
    deptName: string;   // 표시용(옵션 라벨 or 서버 제공)
    company: string;    // company
    roles: string;      // roles
    createdAt: string;  // createdAt (ISO)
    updatedAt: string;  // updatedAt (ISO)
};

/** 조회 파라미터 */
export type UserSearch = {
    page?: number;
    size?: number;
    userId?: string;
    userName?: string;
    roles?: string;
    deptCode?: string;
    company?: string;
};

/** 공통 페이지 응답(언래핑된 data) */
export type Page<T> = {
    items: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
};

/** 백엔드에서 내려오는 키 형태 */
type BackendUser = {
    id: string;
    name: string;
    deptCode: string;
    company: string;
    roles: string;
    createdAt: string;
    updatedAt: string;
    deptName?: string; // 선택적으로 내려올 수 있음
};
type BackendPage<T> = {
    items: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
};

/** 사용자 목록 조회 */
export async function fetchUsers(q: UserSearch): Promise<Page<UserRow>> {
    const p = new URLSearchParams();
    if (q.page != null) p.set("page", String(q.page));
    if (q.size != null) p.set("size", String(q.size));
    if (q.userId) p.set("userId", q.userId);
    if (q.userName) p.set("userName", q.userName);
    if (q.roles) p.set("roles", q.roles);
    if (q.deptCode) p.set("deptCode", q.deptCode);
    if (q.company) p.set("company", q.company);

    // apiFetch는 ApiResponse<T>의 data만 언래핑해서 돌려줌
    const raw = await apiFetch<BackendPage<BackendUser>>(`/api/users?${p.toString()}`);

    // 키 매핑(id→userId, name→userName) + deptName 보정
    return {
        ...raw,
        items: (raw.items ?? []).map((u) => ({
            userId: u.id,
            userName: u.name,
            deptCode: u.deptCode,
            deptName: u.deptName ?? "", // 없으면 빈값(화면에서 옵션으로 대체 표시)
            company: u.company,
            roles: u.roles,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        })),
    };
}

/** 단건 업데이트 */
export async function updateUser(
    row: Partial<UserRow> & { userId: string }
): Promise<true> {
    const payload = {
        userName: row.userName,
        deptCode: row.deptCode,
        company: row.company,
        roles: row.roles,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
    await apiFetch(`/api/users/${encodeURIComponent(row.userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return true;
}

/** 공통 옵션 타입 */
export type SimpleOption = { value: string; label: string };

/** 부서 목록 조회 (DB 기반) */
type Dept = { code: string; name: string };
export async function fetchDeptOptions(): Promise<SimpleOption[]> {
    const list = await apiFetch<Dept[]>(API.user.dept.list);
    return (list ?? []).map((d) => ({ value: d.code, label: d.name }));
}

/** 권한 옵션(임시) */
export async function fetchRoleOptions(): Promise<SimpleOption[]> {
    return [
        { value: "ADMIN", label: "ADMIN" },
        { value: "DEVELOPER", label: "DEVELOPER" },
    ];
}

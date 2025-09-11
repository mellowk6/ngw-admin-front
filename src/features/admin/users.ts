import { apiFetch } from "@core/http/client";
import { API } from "@/app/constants/apiPaths";

/** 단일 사용자 행 타입 */
export type UserRow = {
    userId: string;
    userName: string;
    deptCode: string;      // 코드
    deptName: string;      // 표시용 이름
    companyName: string;
    role: string;
    joinedAt: string;
    updatedAt: string;
};

/** 조회 요청 파라미터 */
export type UserSearch = {
    page?: number;
    size?: number;
    userId?: string;
    userName?: string;
    role?: string;
    deptCode?: string;      // 코드로 검색
    companyName?: string;
};

/** 공통 페이지 응답 */
export type Page<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
};

/** 사용자 목록 조회 */
export async function fetchUsers(q: UserSearch): Promise<Page<UserRow>> {
    const p = new URLSearchParams();
    if (q.page != null) p.set("page", String(q.page));
    if (q.size != null) p.set("size", String(q.size));
    if (q.userId) p.set("userId", q.userId);
    if (q.userName) p.set("userName", q.userName);
    if (q.role) p.set("role", q.role);
    if (q.deptCode) p.set("deptCode", q.deptCode);       // deptCode로 전송
    if (q.companyName) p.set("companyName", q.companyName);

    return apiFetch<Page<UserRow>>(`/api/users?${p.toString()}`);
}

/** 단건 업데이트 */
export async function updateUser(
    row: Partial<UserRow> & { userId: string }
): Promise<true> {
    const payload = {
        userName: row.userName,
        deptCode: row.deptCode,            // 코드로 보냄
        companyName: row.companyName,
        role: row.role,
        joinedAt: row.joinedAt,
        updatedAt: row.updatedAt,
    };

    await apiFetch(`/api/users/${encodeURIComponent(row.userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return true;
}

/** 옵션 타입 */
export type SimpleOption = { value: string; label: string };

/** 부서 목록 조회 (DB 기반) */
type Dept = { code: string; name: string };

export async function fetchDeptOptions(): Promise<SimpleOption[]> {
    // 회원가입과 동일한 엔드포인트 사용
    const list = await apiFetch<Dept[]>(API.user.dept.list);
    return (list ?? []).map((d) => ({ value: d.code, label: d.name }));
}

/** 권한 옵션(임시 하드코딩) */
export async function fetchRoleOptions(): Promise<SimpleOption[]> {
    return [
        { value: "ADMIN",     label: "ADMIN" },
        { value: "DEVELOPER", label: "DEVELOPER" },
    ];
}

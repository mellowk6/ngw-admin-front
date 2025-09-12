import { apiFetch } from "@core/http/client";
import { API } from "@/app/constants/apiPaths";

/** ----- 공통 타입 ----- */
export type Page<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
};

export type SimpleOption = { value: string; label: string };

/** ----- 서버 DTO ----- */
type RoleDto = {
    roleName: string;
    menuScope?: string;   // 예: "ALL" 또는 서버 표시용 문자열
    createdAt?: string;   // yyyy-MM-dd
    updatedAt?: string;   // yyyy-MM-dd
};

type ApiResponse<T> = { data: T };
type PageResponse<T> = {
    items: T[];
    page: number;
    size: number;
    total: number;
    totalPages: number;
};

/** ----- 프론트 행 모델 ----- */
export type RoleRow = {
    role: string;          // 권한명
    menuIds: string[];     // ✅ 서버 전송/저장은 이것만 사용
    menuNames?: string;    // 표시용(서버가 내려주면 화면에만 사용)
    createdAt: string;
    updatedAt: string;
};

/** 검색 파라미터 */
export type RoleSearch = {
    page?: number;
    size?: number;
    role?: string;
    menuId?: string;
};

/** 내부: PageResponse → Page 로 변환 */
function toPage<T, U>(
    raw: ApiResponse<PageResponse<T>> | PageResponse<T>,
    map: (t: T) => U
): Page<U> {
    const p = (raw as any)?.data
        ? (raw as ApiResponse<PageResponse<T>>).data
        : (raw as PageResponse<T>);
    const items = p?.items ?? [];
    return {
        content: items.map(map),
        totalPages: p?.totalPages ?? 0,
        totalElements: p?.total ?? 0,
        number: p?.page ?? 0,
    };
}

function parseMenuIds(scope?: string): string[] {
    if (!scope) return [];
    return scope.split(",").map(s => s.trim()).filter(Boolean);
}

/** 권한 목록 조회 */
export async function fetchRoles(q: RoleSearch): Promise<Page<RoleRow>> {
    const p = new URLSearchParams();
    if (q.page != null) p.set("page", String(q.page));
    if (q.size != null) p.set("size", String(q.size));
    if (q.role) p.set("roleName", q.role);
    if (q.menuId) p.set("menuLike", q.menuId);

    const raw = await apiFetch<any>(`${API.admin.roles.base}?${p.toString()}`);

    return toPage<RoleDto, RoleRow>(raw, (d) => ({
        role: d.roleName,
        menuIds: parseMenuIds(d.menuScope), // ✅ ID CSV → 배열
        menuNames: d.menuScope ?? "",       // 표시용(ALL 등)
        createdAt: d.createdAt ?? "",
        updatedAt: d.updatedAt ?? "",
    }));
}

/** ----- 업서트 공통 바디(✅ ID만 전송) ----- */
type UpsertBody = { roleName: string; menuScope: string };

/** ✅ 무조건 menuIds만 서버로 전송 (콤마 구분) */
function makeUpsertBody(row: { role: string; menuIds: string[] }): UpsertBody {
    const scope = (row.menuIds ?? []).join(",");
    return { roleName: row.role, menuScope: scope };
}

/** 권한 생성(✅ ID만 전송) */
export async function createRole(row: { role: string; menuIds: string[] }): Promise<true> {
    await apiFetch(API.admin.roles.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeUpsertBody(row)),
    });
    return true;
}

/** 권한 수정(✅ ID만 전송) */
export async function updateRole(originRole: string, row: Partial<RoleRow>): Promise<true> {
    const body = makeUpsertBody({
        role: row.role ?? originRole,  // 이름 변경 지원
        menuIds: row.menuIds ?? [],
    });

    await apiFetch(API.admin.roles.base, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return true;
}

/** 권한 삭제 */
export async function deleteRole(role: string): Promise<true> {
    await apiFetch(API.admin.roles.base, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleNames: [role] }),
    });
    return true;
}

/** 메뉴 옵션 조회 (리프만) */
type MenuItem = { menuId: string; menuName: string; leaf: boolean; parentId?: string | null };
export async function fetchMenuOptions(): Promise<SimpleOption[]> {
    const raw = await apiFetch<any>(API.admin.menus.list);
    const list: MenuItem[] = (raw?.data ?? raw) as MenuItem[];
    return (list ?? [])
        .filter((m) => !!m.leaf)
        .map((m) => ({ value: m.menuId, label: m.menuName }));
}

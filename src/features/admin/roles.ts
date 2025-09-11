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
// 백엔드 /api/roles 응답의 item DTO
type RoleDto = {
    roleName: string;
    menuScope?: string;   // 예: "ALL", "로그 조회" (표시용 문자열)
    createdAt?: string;   // yyyy-MM-dd
    updatedAt?: string;   // yyyy-MM-dd
};

// 공통 래핑
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
    role: string;            // 권한명
    menuIds: string[];       // 선택형 UI에서 쓰는 메뉴ID 배열(백엔드는 문자열을 받으므로 전송 시 변환)
    menuNames?: string;      // 서버 표시용 문자열(있으면 그대로 표시)
    createdAt: string;
    updatedAt: string;
};

/** 검색 파라미터 */
export type RoleSearch = {
    page?: number;
    size?: number;
    role?: string;
    menuId?: string;   // 선택: 특정 메뉴ID 포함 권한 검색
};

/** 내부: PageResponse → Page 로 변환 */
function toPage<T, U>(
    raw: ApiResponse<PageResponse<T>> | PageResponse<T>,
    map: (t: T) => U
): Page<U> {
    // apiFetch가 언랩했어도, 안 했어도 모두 대응
    const p = (raw as any)?.data ? (raw as ApiResponse<PageResponse<T>>).data
        : (raw as PageResponse<T>);
    const items = p?.items ?? [];
    return {
        content: items.map(map),
        totalPages: p?.totalPages ?? 0,
        totalElements: p?.total ?? 0,
        number: p?.page ?? 0,
    };
}

/** 권한 목록 조회 (백엔드 래핑 응답 언랩 + 매핑) */
export async function fetchRoles(q: RoleSearch): Promise<Page<RoleRow>> {
    const p = new URLSearchParams();
    if (q.page != null) p.set("page", String(q.page));
    if (q.size != null) p.set("size", String(q.size));
    if (q.role) p.set("roleName", q.role);
    if (q.menuId) p.set("menuLike", q.menuId);

    const raw = await apiFetch<any>(`${API.admin.roles.base}?${p.toString()}`);

    return toPage<RoleDto, RoleRow>(raw, (d) => ({
        role: d.roleName,
        menuIds: [],
        menuNames: d.menuScope ?? "",
        createdAt: d.createdAt ?? "",
        updatedAt: d.updatedAt ?? "",
    }));
}

/** 권한 생성/수정 공통: 백엔드는 upsert(POST) */
type UpsertBody = { roleName: string; menuScope: string };
function makeUpsertBody(row: { role: string; menuIds: string[]; menuNames?: string }): UpsertBody {
    // 서버는 menuScope(문자열)만 받음
    // UI에서 menuNames가 있으면 우선 사용, 없으면 menuIds를 콤마로 묶어 전송
    const scope =
        row.menuNames && row.menuNames.trim().length > 0
            ? row.menuNames
            : (row.menuIds ?? []).join(",");
    return { roleName: row.role, menuScope: scope };
}

/** 권한 생성 */
export async function createRole(row: { role: string; menuIds: string[]; menuNames?: string }): Promise<true> {
    await apiFetch(API.admin.roles.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeUpsertBody(row)),
    });
    return true;
}

/** 권한 수정 (백엔드 upsert로 통일) */
export async function updateRole(role: string, row: Partial<RoleRow>): Promise<true> {
    await apiFetch(API.admin.roles.base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
            makeUpsertBody({
                role,
                menuIds: row.menuIds ?? [],
                menuNames: row.menuNames ?? "",
            })
        ),
    });
    return true;
}

/** 권한 삭제 (백엔드는 DELETE + body: { roleNames: [...] }) */
export async function deleteRole(role: string): Promise<true> {
    await apiFetch(API.admin.roles.base, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleNames: [role] }),
    });
    return true;
}

/** 메뉴 옵션 조회 (도메인 Menu 그대로 반환 → 리프만 필터링) */
type MenuItem = { menuId: string; menuName: string; leaf: boolean; parentId?: string | null };
export async function fetchMenuOptions(): Promise<SimpleOption[]> {
    // 래핑/비래핑 둘 다 대응
    const raw = await apiFetch<any>(API.admin.menus.list);
    const list: MenuItem[] = (raw?.data ?? raw) as MenuItem[];
    return (list ?? [])
        .filter((m) => !!m.leaf) // 리프만
        .map((m) => ({ value: m.menuId, label: m.menuName }));
}

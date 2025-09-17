import { apiFetch } from "@core/http/client";

/** 공통: 단순 옵션 */
export type SimpleOption = { value: string; label: string };

/** 그리드 행 (백엔드 도메인 Menu와 1:1) */
export type MenuRow = {
    menuId: string;
    parentId: string | null;
    menuName: string;
    leaf: boolean;
    createdAt?: string;
    updatedAt?: string;
};

/** 조회 파라미터 */
export type MenuSearch = {
    page?: number;       // 1-base
    size?: number;
    keyword?: string;    // name/path 통합 검색용(서버에서 name like 처리 권장)
    parentId?: string | null;
    leaf?: boolean | ""; // ""=전체
};

/** 공통 페이징 응답 포맷 */
export type Page<T> = {
    items: T[];
    total: number;
    page: number;       // 1-base
    size: number;
    totalPages: number;
};

/** 관리용 업서트 폼 */
export type UpsertMenu = {
    menuId: string;                // PK
    parentId?: string | null;
    menuName: string;
    leaf?: boolean;
};

/** 업데이트 결과(백엔드 ApiResponse 언랩 기준) */
export type UpdateOkResponse = { ok: boolean; id?: string };

/** 드롭박스 옵션: /api/menus (도메인 그대로) */
export async function fetchMenuOptions(): Promise<SimpleOption[]> {
    const list = await apiFetch<MenuRow[]>("/api/menus");
    return list.map((m) => ({
        value: m.menuId,
        label: `${m.menuName} (${m.menuId})`,
    }));
}

/**
 * 페이징 목록: 먼저 /api/menus/page 시도 → 404 등 실패 시 /api/menus로 폴백(클라 페이징)
 * 서버가 ApiResponse<T>를 돌려주면 apiFetch가 data만 언랩해줌.
 */
export async function fetchMenus(params: MenuSearch): Promise<Page<MenuRow>> {
    const p = params.page ?? 1;
    const s = params.size ?? 10;

    const qs = new URLSearchParams();
    qs.set("page", String(p));
    qs.set("size", String(s));
    if (params.keyword) qs.set("keyword", params.keyword);
    if (params.parentId) qs.set("parentId", params.parentId);
    if (params.leaf !== "" && params.leaf !== undefined) qs.set("leaf", String(params.leaf));

    try {
        // 관리용 페이지 API가 있을 때
        return await apiFetch<Page<MenuRow>>(`/api/menus/page?${qs.toString()}`);
    } catch {
        // 폴백: 드롭박스용 전체 목록을 가져와 클라에서 슬라이스
        const all = await apiFetch<MenuRow[]>("/api/menus");
        const filtered = all.filter((m) => {
            if (params.keyword) {
                const k = params.keyword.toLowerCase();
                if (!(m.menuName?.toLowerCase().includes(k) || m.menuId?.toLowerCase().includes(k))) {
                    return false;
                }
            }
            if (params.parentId && m.parentId !== params.parentId) return false;
            if (params.leaf !== "" && params.leaf !== undefined && m.leaf !== params.leaf) return false;
            return true;
        });
        const start = (p - 1) * s;
        const items = filtered.slice(start, start + s);
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / s));
        return { items, total, page: p, size: s, totalPages };
    }
}

/** 생성 */
export async function createMenu(body: UpsertMenu): Promise<UpdateOkResponse> {
    return apiFetch<UpdateOkResponse>("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

/** 수정 */
export async function updateMenu(body: UpsertMenu): Promise<UpdateOkResponse> {
    return apiFetch<UpdateOkResponse>(`/api/menus/${encodeURIComponent(body.menuId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

/** 삭제 */
export async function deleteMenu(menuId: string): Promise<UpdateOkResponse> {
    return apiFetch<UpdateOkResponse>(`/api/menus/${encodeURIComponent(menuId)}`, {
        method: "DELETE",
    });
}

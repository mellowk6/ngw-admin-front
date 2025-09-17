import { useEffect, useMemo, useRef, useState } from "react";
import {
    fetchMenuOptions,
    fetchMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    type MenuRow,
    type MenuSearch,
    type UpsertMenu,
    type SimpleOption,
} from "@features/admin/menus";

const PAGE_SIZES = [10, 30, 50, 100];

export default function MenusPage() {
    // ===== 검색 컨트롤 =====
    const [keyword, setKeyword] = useState("");
    const [fParentId, setFParentId] = useState<string>("");
    const [fLeaf, setFLeaf] = useState<"" | boolean>("");

    // ===== 페이지 상태 (RolesPage 스타일) =====
    const [page, setPage] = useState(1);     // 1-base
    const [pageSize, setPageSize] = useState(10);

    // ===== 결과 & 상태 =====
    const [rows, setRows] = useState<MenuRow[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // 부모 메뉴 옵션
    const [parentOptions, setParentOptions] = useState<SimpleOption[]>([]);

    // 선택(수정/삭제 버튼용)
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // 모달/폼
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [draft, setDraft] = useState<UpsertMenu | null>(null);

    // 레이아웃 빈영역 클릭 시 선택 해제
    const gridRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!gridRef.current) return;
            if (!gridRef.current.contains(e.target as Node)) {
                setSelectedId(null);
            }
        };
        window.addEventListener("mousedown", onDocDown);
        return () => window.removeEventListener("mousedown", onDocDown);
    }, []);

    const pageLabel = useMemo(() => (totalPages ? page : 0), [page, totalPages]);

    const searchParams: MenuSearch = useMemo(
        () => ({
            page,
            size: pageSize,
            keyword: keyword.trim() || undefined,
            parentId: fParentId || undefined,
            leaf: fLeaf,
        }),
        [page, pageSize, keyword, fParentId, fLeaf]
    );

    // 옵션 로드
    useEffect(() => {
        (async () => {
            const opts = await fetchMenuOptions();
            setParentOptions([{ value: "", label: "전체(루트 포함)" }, ...opts]);
        })();
    }, []);

    // 목록 로드
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const p = await fetchMenus(searchParams);
                setRows(p.items);
                setTotalElements(p.total);
                setTotalPages(p.totalPages);
                setPage(p.page); // 서버/폴백이 모두 1-base로 반환
            } finally {
                setLoading(false);
            }
        })();
    }, [searchParams]);

    const reload = async () => {
        setLoading(true);
        try {
            const p = await fetchMenus(searchParams);
            setRows(p.items);
            setTotalElements(p.total);
            setTotalPages(p.totalPages);
            setPage(p.page);
        } finally {
            setLoading(false);
        }
    };

    // ===== 액션 =====
    const onSearch = () => {
        setPage(1);
        setSelectedId(null);
    };

    const onReset = () => {
        setKeyword("");
        setFParentId("");
        setFLeaf("");
        setPage(1);
        setPageSize(10);
        setSelectedId(null);
    };

    const onAdd = () => {
        setIsEdit(false);
        setDraft({ menuId: "", parentId: "", menuName: "", leaf: true });
        setOpenModal(true);
    };

    const onEdit = () => {
        if (!selectedId) return;
        const r = rows.find((x) => x.menuId === selectedId);
        if (!r) return;
        setIsEdit(true);
        setDraft({
            menuId: r.menuId,
            parentId: r.parentId ?? "",
            menuName: r.menuName,
            leaf: r.leaf,
        });
        setOpenModal(true);
    };

    const onDelete = async () => {
        if (!selectedId) return;
        if (!confirm(`메뉴를 삭제할까요? (${selectedId})`)) return;
        await deleteMenu(selectedId);
        setSelectedId(null);
        await reload();
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft) return;
        if (!draft.menuId || !draft.menuName) {
            alert("메뉴ID/메뉴명을 입력하세요.");
            return;
        }
        if (draft.menuId === (draft.parentId ?? "")) {
            alert("부모ID와 메뉴ID가 동일할 수 없습니다.");
            return;
        }
        if (isEdit) await updateMenu(draft);
        else await createMenu(draft);
        setOpenModal(false);
        setDraft(null);
        await reload();
    };

    // ===== 렌더 =====
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">메뉴 관리</h1>
                <div className="text-xs text-slate-500">총 {totalElements.toLocaleString()}건</div>
            </div>

            {/* Filters (RolesPage 톤) */}
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">키워드</label>
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="메뉴ID/메뉴명"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">부모 메뉴</label>
                    <select
                        value={fParentId}
                        onChange={(e) => setFParentId(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {parentOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">Leaf 여부</label>
                    <select
                        value={fLeaf === "" ? "" : fLeaf ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setFLeaf(v === "" ? "" : v === "true");
                        }}
                        className="border border-slate-300 rounded px-2 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">전체</option>
                        <option value="true">Leaf</option>
                        <option value="false">Branch</option>
                    </select>
                </div>

                <button
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm shadow-sm"
                    onClick={onSearch}
                    disabled={loading}
                >
                    {loading ? "조회 중..." : "조회"}
                </button>

                <button
                    className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-100 text-sm"
                    onClick={onReset}
                    disabled={loading}
                >
                    초기화
                </button>
            </div>

            {/* Card + Table (RolesPage 톤) */}
            <div ref={gridRef} className="bg-white rounded-xl shadow-md border border-slate-200">
                {/* Card header with actions */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">목록</div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-sm disabled:opacity-40"
                            onClick={onAdd}
                            disabled={loading}
                        >
                            추가
                        </button>
                        <button
                            className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40"
                            onClick={onEdit}
                            disabled={loading || !selectedId}
                        >
                            수정
                        </button>
                        <button
                            className="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-sm disabled:opacity-40"
                            onClick={onDelete}
                            disabled={loading || !selectedId}
                        >
                            삭제
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="p-3 overflow-auto min-h-[calc(10*2.5rem+3rem)]">
                    <table className="w-full text-sm table-auto">
                        <colgroup>
                            <col className="w-40" />
                            <col className="w-40" />
                            <col />
                            <col className="w-20" />
                            <col className="w-44" />
                            <col className="w-44" />
                        </colgroup>

                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left px-3 py-2 border-b border-slate-200">메뉴ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">부모ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">메뉴명</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Leaf</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">생성일</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">수정일</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rows.map((r) => {
                            const selected = selectedId === r.menuId;
                            return (
                                <tr
                                    key={r.menuId}
                                    className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50 cursor-pointer ${
                                        selected ? "bg-indigo-50/60" : ""
                                    }`}
                                    onClick={() => setSelectedId((prev) => (prev === r.menuId ? null : r.menuId))}
                                    title={selected ? "선택됨" : "클릭하여 선택"}
                                >
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.menuId}
                                    </td>
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.parentId ?? "ROOT"}
                                    </td>
                                    <td className="px-3 border-b border-slate-200 h-10 align-middle">{r.menuName}</td>
                                    <td className="px-3 border-b border-slate-200 h-10 align-middle">
                                        {r.leaf ? "Y" : "N"}
                                    </td>
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.createdAt?.replace("T", " ").slice(0, 19) ?? ""}
                                    </td>
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.updatedAt?.replace("T", " ").slice(0, 19) ?? ""}
                                    </td>
                                </tr>
                            );
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                                    {loading ? "로드 중..." : "결과가 없습니다."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (RolesPage 톤) */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600">Rows:</span>
                        <select
                            className="border border-slate-300 rounded px-2 py-1"
                            value={pageSize}
                            onChange={(e) => {
                                const s = parseInt(e.target.value, 10);
                                setPageSize(s);
                                setPage(1);
                            }}
                            disabled={loading}
                        >
                            {PAGE_SIZES.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => setPage(1)}
                            disabled={loading || page <= 1}
                            aria-label="first"
                        >
                            《
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={loading || page <= 1}
                            aria-label="prev"
                        >
                            〈
                        </button>
                        <span className="text-slate-700">
              {pageLabel} / {Math.max(totalPages, 0)}
            </span>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={loading || page >= totalPages}
                            aria-label="next"
                        >
                            〉
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => setPage(totalPages)}
                            disabled={loading || page >= totalPages}
                            aria-label="last"
                        >
                            》
                        </button>
                    </div>
                </div>
            </div>

            {/* 업서트 모달 */}
            {openModal && draft && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-[520px] p-4 space-y-3">
                        <h2 className="text-lg font-semibold">{isEdit ? "메뉴 수정" : "새 메뉴"}</h2>

                        <form className="space-y-3" onSubmit={onSubmit}>
                            <div>
                                <label className="block text-sm mb-1">메뉴 ID</label>
                                <input
                                    className="border border-slate-300 px-2 py-1 rounded w-full"
                                    value={draft.menuId}
                                    onChange={(e) => setDraft({ ...draft, menuId: e.target.value })}
                                    disabled={isEdit}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">부모 ID</label>
                                <select
                                    className="border border-slate-300 px-2 py-1 rounded w-full"
                                    value={draft.parentId ?? ""}
                                    onChange={(e) => setDraft({ ...draft, parentId: e.target.value || "" })}
                                >
                                    {parentOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">메뉴명</label>
                                <input
                                    className="border border-slate-300 px-2 py-1 rounded w-full"
                                    value={draft.menuName}
                                    onChange={(e) => setDraft({ ...draft, menuName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Leaf</label>
                                <select
                                    className="border border-slate-300 px-2 py-1 rounded w-full"
                                    value={draft.leaf ? "true" : "false"}
                                    onChange={(e) => setDraft({ ...draft, leaf: e.target.value === "true" })}
                                >
                                    <option value="true">Leaf</option>
                                    <option value="false">Branch</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" className="border border-slate-300 px-3 py-1 rounded" onClick={() => { setOpenModal(false); setDraft(null); }}>
                                    닫기
                                </button>
                                <button type="submit" className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

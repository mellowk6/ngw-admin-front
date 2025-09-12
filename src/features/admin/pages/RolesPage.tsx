import { useEffect, useMemo, useRef, useState } from "react";
import {
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchMenuOptions,
    type RoleRow,
    type SimpleOption,
} from "@features/admin/roles";

const PAGE_SIZES = [10, 30, 50, 100];
const NEW_FLAG = "__NEW__";

export default function RolesPage() {
    // ====== 검색 컨트롤 ======
    const [fRole, setFRole] = useState("");
    const [fMenuId, setFMenuId] = useState("");

    const [menuOptions, setMenuOptions] = useState<SimpleOption[]>([]);

    // ====== 페이지 상태 ======
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // ====== 결과 ======
    const [rows, setRows] = useState<RoleRow[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // ====== 편집 상태 ======
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [draft, setDraft] = useState<Partial<RoleRow>>({});
    const [openPickerFor, setOpenPickerFor] = useState<string | null>(null); // 메뉴 피커 오픈 행

    const pageLabel = useMemo(() => (totalPages ? page + 1 : 0), [page, totalPages]);

    // 그리드 영역 ref (바깥 클릭 시 편집 종료)
    const gridRef = useRef<HTMLDivElement>(null);

    // id → 라벨
    const labelOf = (id: string) => menuOptions.find((o) => o.value === id)?.label ?? id;

    const parseIdsFrom = (s?: string) =>
        (s ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

    const displayMenu = (r: RoleRow) => {
        const ids = (r.menuIds?.length ? r.menuIds : parseIdsFrom(r.menuNames)) ?? [];
        return ids.length ? ids.map(labelOf).join(", ") : (r.menuNames ?? "");
    };

    useEffect(() => {
        (async () => setMenuOptions(await fetchMenuOptions()))();
        load(0, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 바깥 클릭 시 편집 종료
    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!editingKey) return;
            if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
                cancelEdit();
            }
        };
        window.addEventListener("mousedown", onDocDown);
        return () => window.removeEventListener("mousedown", onDocDown);
    }, [editingKey]);

    async function load(p = page, s = pageSize) {
        setLoading(true);
        try {
            // 서버는 MENU_SCOPE(ID CSV)에 대해 LIKE 검색하므로 ID를 그대로 보냄
            const menuLike = fMenuId?.trim() ? fMenuId.trim() : undefined;

            const res = await fetchRoles({
                page: p,
                size: s,
                role: fRole.trim() || undefined,
                menuId: menuLike,
            });

            setRows(res.content ?? []);
            setTotalPages(res.totalPages ?? 0);
            setTotalElements(res.totalElements ?? 0);
            setPage(res.number ?? p);
        } catch (e) {
            console.error(e);
            setRows([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }

    // 편집 시작
    const startEdit = (r: RoleRow) => {
        let mIds = r.menuIds ?? [];
        if (!mIds.length && r.menuNames) {
            const guess = parseIdsFrom(r.menuNames);
            if (guess.length) mIds = guess;
        }
        setEditingKey(r.role);
        setOpenPickerFor(null);
        setDraft({ ...r, menuIds: mIds });
    };

    // 편집 취소
    const cancelEdit = () => {
        setEditingKey(null);
        setOpenPickerFor(null);
        setDraft({});
    };

    // 행 클릭: 편집 ↔ 조회 토글
    const onRowClick = (r: RoleRow, editing: boolean) => {
        if (editing) cancelEdit();
        else startEdit(r);
    };

    // 새 행 추가
    const onAdd = () => {
        if (editingKey === NEW_FLAG) return;
        const newRow: RoleRow = { role: "", menuIds: [], createdAt: "", updatedAt: "" };
        setRows((prev) => [newRow, ...prev]);
        setEditingKey(NEW_FLAG);
        setOpenPickerFor(null);
        setDraft({ ...newRow });
    };

    // 필드 변경
    const setField = <K extends keyof RoleRow>(k: K, v: RoleRow[K]) =>
        setDraft((d) => ({ ...d, [k]: v }));

    // 저장(생성/수정) — ID만 전송
    const onSave = async () => {
        if (!draft) return;
        const role = (draft.role ?? "").trim();
        const menuIds = (draft.menuIds ?? []) as string[];
        if (!role) {
            alert("권한명을 입력하세요.");
            return;
        }
        setLoading(true);
        try {
            if (editingKey === NEW_FLAG) await createRole({ role, menuIds });
            else if (editingKey) await updateRole(editingKey, { role, menuIds });
            cancelEdit();
            await load(page, pageSize);
        } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 삭제
    const onDelete = async () => {
        if (!editingKey) {
            alert("삭제할 행을 먼저 선택하세요.");
            return;
        }
        if (editingKey === NEW_FLAG) {
            setRows((prev) => prev.slice(1));
            cancelEdit();
            return;
        }
        if (!confirm(`권한 '${editingKey}' 을(를) 삭제할까요?`)) return;
        setLoading(true);
        try {
            await deleteRole(editingKey);
            cancelEdit();
            await load(page, pageSize);
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const onSearch = () => {
        setPage(0);
        load(0, pageSize);
    };
    const onReset = () => {
        setFRole("");
        setFMenuId("");
        setPage(0);
        setPageSize(10);
        setRows([]);
        setTotalPages(0);
        setTotalElements(0);
        cancelEdit();
    };

    // ★ 그리드 내 "빈 영역" 클릭 시 편집 종료
    const onBlankAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!editingKey) return;
        // 컨테이너 자체를 클릭한 경우(테이블/행이 아닌 진짜 빈 공간)
        if (e.currentTarget === e.target) {
            cancelEdit();
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">권한 관리</h1>
                <div className="text-xs text-slate-500">총 {totalElements.toLocaleString()}건</div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">권한명</label>
                    <input
                        value={fRole}
                        onChange={(e) => setFRole(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="권한명"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">메뉴</label>
                    <select
                        value={fMenuId}
                        onChange={(e) => setFMenuId(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {menuOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
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

            {/* Card + Table */}
            <div ref={gridRef} className="bg-white rounded-xl shadow-md border border-slate-200">
                {/* Table header row with actions */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">목록</div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-sm disabled:opacity-40"
                            onClick={onAdd}
                            disabled={loading || editingKey === NEW_FLAG}
                            title="새 권한 추가"
                        >
                            추가
                        </button>
                        <button
                            className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40"
                            onClick={onSave}
                            disabled={loading || !editingKey}
                            title={editingKey ? "현재 편집 중인 행 저장" : "편집 중인 행이 없습니다"}
                        >
                            수정
                        </button>
                        <button
                            className="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 text-sm disabled:opacity-40"
                            onClick={onDelete}
                            disabled={loading || !editingKey}
                        >
                            삭제
                        </button>
                    </div>
                </div>

                {/* min-height = 약 10행, 가로/세로 모두 자동 스크롤 */}
                <div
                    className="p-3 overflow-auto min-h-[calc(10*2.5rem+3rem)]"
                    onClick={onBlankAreaClick} // ★ 빈 영역 클릭 시 편집 종료
                >
                    <table className="w-full text-sm table-auto">
                        {/* 반응형 폭 분배: 1열/3열/4열 고정, 2열은 남은 공간 전체 */}
                        <colgroup>
                            <col className="w-48" />
                            <col />
                            <col className="w-40" />
                            <col className="w-40" />
                        </colgroup>

                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left px-3 py-2 border-b border-slate-200">권한명</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">메뉴 권한</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">생성일자</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">변경일자</th>
                        </tr>
                        </thead>

                        <tbody>
                        {rows.map((r, idx) => {
                            const isNewRow = editingKey === NEW_FLAG && idx === 0;
                            const editing = isNewRow || editingKey === r.role;
                            const pickerOpen = openPickerFor === r.role;

                            return (
                                <tr
                                    key={isNewRow ? NEW_FLAG : r.role}
                                    className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50 cursor-pointer ${
                                        editing ? "bg-indigo-50/60" : ""
                                    }`}
                                    onClick={() => onRowClick(r, editing)} // 행 어디를 클릭해도 동작
                                    title={editing ? "편집 중" : "클릭하여 편집"}
                                >
                                    {/* 권한명 */}
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {editing ? (
                                            <input
                                                value={String(draft.role ?? "")}
                                                onChange={(e) => setField("role", e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="border border-slate-300 rounded px-2 h-8 text-sm w-full"
                                            />
                                        ) : (
                                            r.role
                                        )}
                                    </td>

                                    {/* 메뉴 권한 – 오버레이 피커(열림/닫힘 제어) */}
                                    <td
                                        className="px-3 border-b border-slate-200 h-10 align-middle relative overflow-visible"
                                        onClick={(e) => {
                                            if (editing) {
                                                e.stopPropagation();
                                                setOpenPickerFor(r.role);
                                            }
                                        }}
                                    >
                                        {editing ? (
                                            <div className="relative h-8">
                                                {/* 표시 텍스트(피커 트리거) + 화살표 UI */}
                                                {!pickerOpen && (
                                                    <div className="relative select-none bg-white border border-slate-300 rounded px-2 pr-8 h-8 leading-8 text-sm w-full min-w-0 cursor-pointer">
                                                        {((draft.menuIds ?? []) as string[]).length
                                                            ? (draft.menuIds as string[]).map(labelOf).join(", ")
                                                            : "메뉴 선택…"}
                                                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                ▾
                              </span>
                                                    </div>
                                                )}

                                                {/* 실제 피커(열렸을 때만 렌더) */}
                                                {pickerOpen && (
                                                    <select
                                                        multiple
                                                        size={10}
                                                        autoFocus
                                                        value={(draft.menuIds ?? []) as string[]}
                                                        onChange={(e) => {
                                                            const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                                                            setField("menuIds", vals as any);
                                                            setOpenPickerFor(null); // 선택 즉시 닫기
                                                        }}
                                                        onBlur={() => setOpenPickerFor(null)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Escape") setOpenPickerFor(null);
                                                        }}
                                                        className="absolute top-0 left-0 z-40 w-full min-w-0 max-h-[60vh] border border-slate-300 rounded bg-white shadow-xl text-sm"
                                                        title="여러 항목을 선택하려면 Ctrl/Cmd를 누른 채 클릭하세요"
                                                    >
                                                        {menuOptions.map((o) => (
                                                            <option key={o.value} value={o.value}>
                                                                {o.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        ) : (
                                            displayMenu(r)
                                        )}
                                    </td>

                                    {/* 생성/변경일자 */}
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.createdAt}
                                    </td>
                                    <td className="px-3 border-b border-slate-200 whitespace-nowrap h-10 align-middle">
                                        {r.updatedAt}
                                    </td>
                                </tr>
                            );
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                                    {loading ? "로드 중..." : "결과가 없습니다."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600">Rows:</span>
                        <select
                            className="border border-slate-300 rounded px-2 py-1"
                            value={pageSize}
                            onChange={(e) => {
                                const s = parseInt(e.target.value, 10);
                                setPageSize(s);
                                setPage(0);
                                load(0, s);
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
                            onClick={() => {
                                setPage(0);
                                load(0, pageSize);
                            }}
                            disabled={loading || page <= 0}
                            aria-label="first"
                        >
                            《
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => {
                                const p = Math.max(0, page - 1);
                                setPage(p);
                                load(p, pageSize);
                            }}
                            disabled={loading || page <= 0}
                            aria-label="prev"
                        >
                            〈
                        </button>
                        <span className="text-slate-700">
              {pageLabel} / {Math.max(totalPages, 0)}
            </span>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => {
                                const p = Math.min(Math.max(0, totalPages - 1), page + 1);
                                setPage(p);
                                load(p, pageSize);
                            }}
                            disabled={loading || page >= totalPages - 1}
                            aria-label="next"
                        >
                            〉
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={() => {
                                const p = Math.max(0, totalPages - 1);
                                setPage(p);
                                load(p, pageSize);
                            }}
                            disabled={loading || page >= totalPages - 1}
                            aria-label="last"
                        >
                            》
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

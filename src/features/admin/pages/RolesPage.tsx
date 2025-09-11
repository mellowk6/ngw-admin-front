import { useEffect, useMemo, useState } from "react";
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

    const pageLabel = useMemo(() => (totalPages ? page + 1 : 0), [page, totalPages]);

    // id → 라벨 매핑
    const labelOf = (id: string) => menuOptions.find((o) => o.value === id)?.label ?? id;

    // 선택된 menuIds → 표시용 문자열로
    const toMenuNames = (ids: string[]) => (ids ?? []).map(labelOf).join(", ");

    useEffect(() => {
        (async () => {
            setMenuOptions(await fetchMenuOptions());
        })();
        load(0, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function load(p = page, s = pageSize) {
        setLoading(true);
        try {
            // ★ 서버는 menuLike(사람이 읽는 문자열)를 기대하므로 label을 보냄
            const menuLike = fMenuId ? labelOf(fMenuId) : undefined;

            const res = await fetchRoles({
                page: p,
                size: s,
                role: fRole.trim() || undefined,
                menuId: menuLike, // ← roles.ts 쪽에서 menuLike로 매핑됨
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

    // 편집 시작(기존행 클릭)
    const startEdit = (r: RoleRow) => {
        setEditingKey(r.role);
        setDraft({ ...r });
    };

    // 새 행 추가
    const onAdd = () => {
        if (editingKey === NEW_FLAG) return;
        const newRow: RoleRow = {
            role: "",
            menuIds: [],
            createdAt: "",
            updatedAt: "",
        };
        setRows((prev) => [newRow, ...prev]);
        setEditingKey(NEW_FLAG);
        setDraft({ ...newRow });
    };

    // 필드 변경
    const setField = <K extends keyof RoleRow>(k: K, v: RoleRow[K]) =>
        setDraft((d) => ({ ...d, [k]: v }));

    // 저장(생성/수정)
    const onSave = async () => {
        if (!draft) return;

        // 검증
        const role = (draft.role ?? "").trim();
        const menuIds = (draft.menuIds ?? []) as string[];
        if (!role) {
            alert("권한명을 입력하세요.");
            return;
        }

        // ★ 서버가 저장하는 건 menuScope(문자열)이므로 label로 변환해 함께 보냄
        const menuNames = toMenuNames(menuIds);

        setLoading(true);
        try {
            if (editingKey === NEW_FLAG) {
                await createRole({ role, menuIds, menuNames }); // ★ menuNames 동봉
            } else if (editingKey) {
                await updateRole(editingKey, { role, menuIds, menuNames }); // ★ menuNames 동봉
            }
            setEditingKey(null);
            setDraft({});
            await load(page, pageSize);
        } catch (e) {
            console.error(e);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 삭제(현재 편집 중인 행 기준)
    const onDelete = async () => {
        if (!editingKey) {
            alert("삭제할 행을 먼저 선택하세요.");
            return;
        }
        if (editingKey === NEW_FLAG) {
            // 신규행은 UI에서만 제거
            setRows((prev) => prev.slice(1));
            setEditingKey(null);
            setDraft({});
            return;
        }
        if (!confirm(`권한 '${editingKey}' 을(를) 삭제할까요?`)) return;

        setLoading(true);
        try {
            await deleteRole(editingKey);
            setEditingKey(null);
            setDraft({});
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
        setEditingKey(null);
        setDraft({});
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
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
                {/* Table header row with actions */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">목록</div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-sm disabled:opacity-40"
                            onClick={() => load(page, pageSize)}
                            disabled={loading}
                        >
                            조회
                        </button>
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

                <div className="p-3 overflow-x-auto">
                    <table className="w-full text-sm">
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
                            const isNewRow = editingKey === NEW_FLAG && idx === 0; // 추가한 첫 행
                            const editing = isNewRow || editingKey === r.role;

                            return (
                                <tr
                                    key={isNewRow ? NEW_FLAG : r.role}
                                    className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50 cursor-pointer ${
                                        editing ? "ring-2 ring-indigo-300" : ""
                                    }`}
                                    onClick={() => !isNewRow && startEdit(r)}
                                    title={editing ? "편집 중" : "클릭하여 편집"}
                                >
                                    {/* 권한명 */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {editing ? (
                                            <input
                                                value={String(draft.role ?? "")}
                                                onChange={(e) => setField("role", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1 w-48"
                                            />
                                        ) : (
                                            r.role
                                        )}
                                    </td>

                                    {/* 메뉴 권한 (멀티 셀렉트) */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <select
                                                multiple
                                                value={(draft.menuIds ?? []) as string[]}
                                                onChange={(e) => {
                                                    const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                                                    setField("menuIds", vals as any);
                                                }}
                                                className="border border-slate-300 rounded px-2 py-1 w-72 h-24"
                                                title="Ctrl(또는 Cmd)로 다중 선택"
                                            >
                                                {menuOptions.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            // 표시는 서버 제공 문자열 또는 클라이언트에서 조합
                                            r.menuNames ?? (r.menuIds ?? []).map(labelOf).join(", ")
                                        )}
                                    </td>

                                    {/* 생성/변경일자 */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {r.createdAt}
                                    </td>
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
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

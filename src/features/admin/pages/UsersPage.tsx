import { useEffect, useMemo, useState } from "react";
import {
    fetchUsers,
    updateUser,
    fetchRoleOptions,
    fetchDeptOptions,
    type UserRow,
    type SimpleOption,
} from "@features/admin/users";

const PAGE_SIZES = [10, 30, 50, 100];

export default function UsersPage() {
    // ====== 검색 컨트롤 ======
    const [fUserId, setFUserId] = useState("");
    const [fUserName, setFUserName] = useState("");
    const [fRole, setFRole] = useState("");
    const [fDept, setFDept] = useState("");
    const [fCompany, setFCompany] = useState("");

    const [roleOptions, setRoleOptions] = useState<SimpleOption[]>([]);
    const [deptOptions, setDeptOptions] = useState<SimpleOption[]>([]);

    // ====== 페이지 상태 ======
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // ====== 결과 ======
    const [rows, setRows] = useState<UserRow[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // ====== 편집 상태 (한 행만 편집) ======
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Partial<UserRow>>({});

    // 초기 옵션 로드 및 첫 조회
    useEffect(() => {
        (async () => {
            const [roles, depts] = await Promise.all([fetchRoleOptions(), fetchDeptOptions()]);
            setRoleOptions(roles);
            setDeptOptions(depts);
        })();
        load(0, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function load(p = page, s = pageSize) {
        setLoading(true);
        try {
            const res = await fetchUsers({
                page: p,
                size: s,
                userId: fUserId.trim() || undefined,
                userName: fUserName.trim() || undefined,
                role: fRole || undefined,
                deptCode: fDept || undefined,
                companyName: fCompany.trim() || undefined,
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

    // 조회/초기화
    const onSearch = () => { setPage(0); load(0, pageSize); };
    const onReset = () => {
        setFUserId(""); setFUserName(""); setFRole(""); setFDept(""); setFCompany("");
        setPage(0); setPageSize(10);
        setRows([]); setTotalPages(0); setTotalElements(0);
        setEditingId(null); setDraft({});
    };

    // 페이지 이동
    const goFirst = () => { setPage(0); load(0, pageSize); };
    const goPrev  = () => { const p = Math.max(0, page - 1); setPage(p); load(p, pageSize); };
    const goNext  = () => { const p = Math.min(Math.max(0, totalPages - 1), page + 1); setPage(p); load(p, pageSize); };
    const goLast  = () => { const p = Math.max(0, totalPages - 1); setPage(p); load(p, pageSize); };

    const pageLabel = useMemo(() => (totalPages ? page + 1 : 0), [page, totalPages]);

    // 편집 시작
    const startEdit = (r: UserRow) => {
        setEditingId(r.userId);
        setDraft({ ...r });
    };

    // 편집 중 변경 반영
    const upd = (k: keyof UserRow, v: string) => setDraft((d) => ({ ...d, [k]: v }));

    // 수정 적용 (단건)
    const onUpdate = async () => {
        if (!editingId || !draft?.userId) return;
        await updateUser({
            userId: editingId,
            userName: draft.userName!,
            deptName: draft.deptName!,
            companyName: draft.companyName!,
            role: draft.role!,
            // 날짜 변경이 필요하면 포함
            joinedAt: draft.joinedAt!,
            updatedAt: draft.updatedAt!,
        });
        setEditingId(null);
        setDraft({});
        // 반영 후 재조회
        await load(page, pageSize);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">사용자 관리</h1>
                <div className="text-xs text-slate-500">총 {totalElements.toLocaleString()}건</div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">사용자ID</label>
                    <input
                        value={fUserId}
                        onChange={(e) => setFUserId(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="사용자ID"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">사용자명</label>
                    <input
                        value={fUserName}
                        onChange={(e) => setFUserName(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="사용자명"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">권한</label>
                    <select
                        value={fRole}
                        onChange={(e) => setFRole(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">부서정보</label>
                    <select
                        value={fDept}
                        onChange={(e) => setFDept(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {deptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">회사명</label>
                    <input
                        value={fCompany}
                        onChange={(e) => setFCompany(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="회사명"
                    />
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
                            className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm disabled:opacity-40"
                            onClick={onUpdate}
                            disabled={loading || !editingId}
                            title={editingId ? "현재 편집 중인 행을 저장" : "편집 중인 행이 없습니다"}
                        >
                            수정
                        </button>
                    </div>
                </div>

                <div className="p-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left px-3 py-2 border-b border-slate-200">사용자ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">사용자명</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">부서정보</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">회사명</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">권한</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">가입일자</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">변경일자</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r) => {
                            const editing = editingId === r.userId;
                            return (
                                <tr
                                    key={r.userId}
                                    className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50 cursor-pointer ${editing ? "ring-2 ring-indigo-300" : ""}`}
                                    onClick={() => startEdit(r)}
                                    title={editing ? "편집 중" : "클릭하여 편집"}
                                >
                                    {/* 사용자ID: key라서 read-only */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">{r.userId}</td>

                                    {/* 사용자명 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <input
                                                value={String(draft.userName ?? "")}
                                                onChange={(e) => upd("userName", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1 w-40"
                                            />
                                        ) : (
                                            r.userName
                                        )}
                                    </td>

                                    {/* 부서정보 (셀렉트) */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <select
                                                value={String(draft.deptName ?? "")}
                                                onChange={(e) => upd("deptName", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1 w-56"
                                            >
                                                {deptOptions.map((d) => (
                                                    <option key={d.value} value={d.value}>{d.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            r.deptName
                                        )}
                                    </td>

                                    {/* 회사명 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <input
                                                value={String(draft.companyName ?? "")}
                                                onChange={(e) => upd("companyName", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1 w-48"
                                            />
                                        ) : (
                                            r.companyName
                                        )}
                                    </td>

                                    {/* 권한 (셀렉트) */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <select
                                                value={String(draft.role ?? "")}
                                                onChange={(e) => upd("role", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1 w-40"
                                            >
                                                {roleOptions.map((o) => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            r.role
                                        )}
                                    </td>

                                    {/* 가입일자 / 변경일자 (표시는 텍스트, 필요 시 date input로 변경) */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {editing ? (
                                            <input
                                                type="date"
                                                value={(draft.joinedAt ?? r.joinedAt).substring(0, 10)}
                                                onChange={(e) => upd("joinedAt", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1"
                                            />
                                        ) : (
                                            r.joinedAt
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {editing ? (
                                            <input
                                                type="date"
                                                value={(draft.updatedAt ?? r.updatedAt).substring(0, 10)}
                                                onChange={(e) => upd("updatedAt", e.target.value)}
                                                className="border border-slate-300 rounded px-2 py-1"
                                            />
                                        ) : (
                                            r.updatedAt
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                                    {loading ? "로드 중..." : "결과가 없습니다."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (로그 화면과 동일) */}
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
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={goFirst}
                            disabled={loading || page <= 0}
                            aria-label="first"
                        >
                            《
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={goPrev}
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
                            onClick={goNext}
                            disabled={loading || page >= totalPages - 1}
                            aria-label="next"
                        >
                            〉
                        </button>
                        <button
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                            onClick={goLast}
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
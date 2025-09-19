import { useEffect, useMemo, useRef, useState } from "react";
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
    const [fRoles, setFRoles] = useState(""); // ROLES
    const [fDept, setFDept] = useState(""); // DEPT_CODE
    const [fCompany, setFCompany] = useState(""); // COMPANY

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

    // ====== 편집 상태 ======
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Partial<UserRow>>({});

    // 카드 래퍼 ref (바깥 클릭 시 편집 종료)
    const cardRef = useRef<HTMLDivElement>(null);

    // 바깥 클릭 → 편집 해제
    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!editingId) return;
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                cancelEdit();
            }
        };
        window.addEventListener("mousedown", onDocDown);
        return () => window.removeEventListener("mousedown", onDocDown);
    }, [editingId]);

    // 초기 옵션 로드 및 첫 조회
    useEffect(() => {
        (async () => {
            try {
                const [roles, depts] = await Promise.all([fetchRoleOptions(), fetchDeptOptions()]);
                setRoleOptions(roles);
                setDeptOptions(depts);
            } catch (e) {
                console.error("옵션 로드 실패", e);
                setRoleOptions([]);
                setDeptOptions([]);
            }
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
                roles: fRoles || undefined,
                deptCode: fDept || undefined,
                company: fCompany.trim() || undefined,
            });

            // ✅ 백엔드 표준(items/total/page/size/totalPages) 사용
            setRows(res.items ?? []);
            setTotalElements(res.total ?? 0);
            setPage(res.page ?? p);
            const tp = res.totalPages ?? Math.ceil(((res.total ?? 0) as number) / ((res.size ?? s) || 1));
            setTotalPages(tp);
        } catch (e) {
            console.error(e);
            setRows([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }

    // 편집 취소(공통)
    const cancelEdit = () => {
        setEditingId(null);
        setDraft({});
    };

    // 조회
    const onSearch = () => {
        setPage(0);
        load(0, pageSize);
    };

    // 초기화: 검색 조건만 리셋 (그리드/페이지 유지)
    const onReset = () => {
        setFUserId("");
        setFUserName("");
        setFRoles("");
        setFDept("");
        setFCompany("");
        cancelEdit();
    };

    // 페이지 이동
    const goFirst = () => {
        setPage(0);
        load(0, pageSize);
    };
    const goPrev = () => {
        const p2 = Math.max(0, page - 1);
        setPage(p2);
        load(p2, pageSize);
    };
    const goNext = () => {
        const p2 = Math.min(Math.max(0, totalPages - 1), page + 1);
        setPage(p2);
        load(p2, pageSize);
    };
    const goLast = () => {
        const p2 = Math.max(0, totalPages - 1);
        setPage(p2);
        load(p2, pageSize);
    };

    const pageLabel = useMemo(() => (totalPages ? page + 1 : 0), [page, totalPages]);

    // 편집 시작
    const startEdit = (r: UserRow) => {
        setEditingId(r.userId);
        setDraft({ ...r });
    };
    // 편집 중 변경
    const upd = (k: keyof UserRow, v: string) => setDraft((d) => ({ ...d, [k]: v }));

    // 행 클릭(편집 중에는 재초기화 금지)
    const onRowClick = (r: UserRow, editing: boolean) => {
        if (!editing) startEdit(r);
    };

    // 편집 셀에서 행 클릭 버블링 방지 헬퍼
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

    // 수정 적용
    const onUpdate = async () => {
        if (!editingId || !draft?.userId) return;
        await updateUser({
            userId: editingId,
            userName: draft.userName!,
            deptCode: draft.deptCode!, // 코드 전송
            company: draft.company!,
            roles: draft.roles!,
            createdAt: draft.createdAt, // 존재할 때만 서버에 전달(서비스에서 허용 시)
            updatedAt: draft.updatedAt, // 존재할 때만 서버에 전달(서비스에서 허용 시)
        });
        cancelEdit();
        await load(page, pageSize);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">사용자 관리</h1>
                <div className="text-xs text-slate-500">총 {totalElements.toLocaleString()}건</div>
            </div>

            {/* Filters (드롭다운이 그리드 위로 나오도록 z-index ↑) */}
            <div className="relative z-30 flex flex-wrap items-end gap-2">
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

                <div className="flex flex-col relative z-30">
                    <label className="text-xs mb-1 text-slate-600">권한</label>
                    <select
                        value={fRoles}
                        onChange={(e) => setFRoles(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {roleOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col relative z-30">
                    <label className="text-xs mb-1 text-slate-600">부서정보</label>
                    <select
                        value={fDept}
                        onChange={(e) => setFDept(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {deptOptions.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
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

            {/* Card + Table (필터보다 z-index 낮게) */}
            <div ref={cardRef} className="relative z-10 bg-white rounded-xl shadow-md border border-slate-200">
                {/* Table header row with actions */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">목록</div>
                    <div className="flex gap-2">
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

                {/* 본문: 빈 여백 클릭 시 편집 해제 */}
                <div
                    className="p-3 overflow-x-auto min-h-[14rem]"
                    onClick={(e) => {
                        if (editingId && e.currentTarget === e.target) cancelEdit();
                    }}
                >
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
                                    key={r.userId ?? r.userName ?? Math.random()}
                                    // 🔵 파란 테두리 제거: ring 클래스 제거, 편집 시 은은한 배경만
                                    className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50 cursor-pointer ${
                                        editing ? "bg-slate-100" : ""
                                    }`}
                                    onClick={() => onRowClick(r, editing)}
                                    title={editing ? "편집 중" : "클릭하여 편집"}
                                >
                                    {/* 사용자ID */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">{r.userId}</td>

                                    {/* 사용자명 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <input
                                                value={String(draft.userName ?? "")}
                                                onChange={(e) => upd("userName", e.target.value)}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
                                                className="border border-slate-300 rounded px-2 py-1 w-40"
                                            />
                                        ) : (
                                            r.userName
                                        )}
                                    </td>

                                    {/* 부서정보 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <select
                                                value={String(draft.deptCode ?? r.deptCode)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    upd("deptCode", e.target.value);
                                                }}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
                                                className="border border-slate-300 rounded px-2 py-1 w-56"
                                            >
                                                {deptOptions.map((d) => (
                                                    <option key={d.value} value={d.value}>
                                                        {d.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            // 서버가 deptName을 안 주면 옵션 라벨로 대체, 그래도 없으면 코드 표시
                                            r.deptName || deptOptions.find((d) => d.value === r.deptCode)?.label || r.deptCode
                                        )}
                                    </td>

                                    {/* 회사명 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <input
                                                value={String(draft.company ?? "")}
                                                onChange={(e) => upd("company", e.target.value)}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
                                                className="border border-slate-300 rounded px-2 py-1 w-48"
                                            />
                                        ) : (
                                            r.company
                                        )}
                                    </td>

                                    {/* 권한 */}
                                    <td className="px-3 py-2 border-b border-slate-200">
                                        {editing ? (
                                            <select
                                                value={String(draft.roles ?? r.roles)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    upd("roles", e.target.value);
                                                }}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
                                                className="border border-slate-300 rounded px-2 py-1 w-40"
                                            >
                                                {roleOptions.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            r.roles
                                        )}
                                    </td>

                                    {/* 가입/변경 일자 */}
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {editing ? (
                                            <input
                                                type="date"
                                                value={(draft.createdAt ?? r.createdAt).substring(0, 10)}
                                                onChange={(e) => upd("createdAt", e.target.value)}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
                                                className="border border-slate-300 rounded px-2 py-1"
                                            />
                                        ) : (
                                            r.createdAt
                                        )}
                                    </td>
                                    <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">
                                        {editing ? (
                                            <input
                                                type="date"
                                                value={(draft.updatedAt ?? r.updatedAt).substring(0, 10)}
                                                onChange={(e) => upd("updatedAt", e.target.value)}
                                                onClick={stop}
                                                onMouseDown={stop}
                                                onFocus={stop}
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

                {/* Pagination — 가운데 정렬 */}
                <div className="grid grid-cols-3 items-center px-3 py-2 border-t border-slate-200 text-sm">
                    {/* 좌: Rows */}
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

                    {/* 중: 페이징 버튼 */}
                    <div className="flex items-center justify-center gap-2">
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
                        <span className="text-slate-700">{pageLabel} / {Math.max(totalPages, 0)}</span>
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

                    {/* 우: 자리 맞춤 */}
                    <div />
                </div>
            </div>
        </div>
    );
}

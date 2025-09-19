import { useEffect, useMemo, useState } from "react";
import { fetchLogs } from "@/features/logs/logs";
import type { LogRow } from "@/features/logs/logs";

const PAGE_SIZES = [10, 30, 50, 100];

export default function LogsPage() {
    // 검색 컨트롤
    const [guid, setGuid] = useState("");
    const [logger, setLogger] = useState<string>(""); // 공란=전체
    // 프리패치 제거: 빈 옵션만 유지 (경고 방지를 위해 렌더에서 사용)
    const [guidOptions] = useState<string[]>([]);
    const [loggerOptions] = useState<string[]>(["ROOT", "MONITOR"]);

    // 페이지 상태
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // 결과
    const [rows, setRows] = useState<LogRow[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    // NGW 호출
    async function load(p = page, s = pageSize, g = guid, l = logger) {
        setLoading(true);
        try {
            const res = await fetchLogs({
                page: p,
                size: s,
                guid: g?.trim() || undefined,
                logger: l || undefined,
            });
            setRows(res.content ?? []);
            setTotalPages(res.totalPages ?? 0);
            setTotalElements(res.totalElements ?? 0);
            // 서버 페이지 번호를 신뢰하려면:
            // setPage(res.number ?? p);
        } catch (e) {
            console.error(e);
            setRows([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }

    // 페이지 진입 시 1회 호출
    useEffect(() => {
        load(0, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 핸들러들
    const onSearch = () => {
        setPage(0);
        load(0, pageSize);
    };

    // ✅ 초기화: 그리드/페이지 상태는 건드리지 않고 검색 조건만 리셋
    const onReset = () => {
        setGuid("");
        setLogger("");
    };

    const goFirst = () => {
        setPage(0);
        load(0, pageSize);
    };
    const goPrev = () => {
        const p = Math.max(0, page - 1);
        setPage(p);
        load(p, pageSize);
    };
    const goNext = () => {
        const p = Math.min(Math.max(0, totalPages - 1), page + 1);
        setPage(p);
        load(p, pageSize);
    };
    const goLast = () => {
        const p = Math.max(0, totalPages - 1);
        setPage(p);
        load(p, pageSize);
    };

    const pageLabel = useMemo(() => (totalPages ? page + 1 : 0), [page, totalPages]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">로그 조회</h1>
                <div className="text-xs text-slate-500">총 {totalElements.toLocaleString()}건</div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">GUID</label>
                    <div className="flex gap-2">
                        <input
                            value={guid}
                            onChange={(e) => setGuid(e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="GUID로 검색"
                            list="guid-list"
                        />
                        <datalist id="guid-list">
                            {guidOptions.map((g) => (
                                <option key={g} value={g} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">Logger</label>
                    <select
                        value={logger}
                        onChange={(e) => setLogger(e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">ALL</option>
                        {loggerOptions.map((l) => (
                            <option key={l} value={l}>
                                {l}
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
                <div className="px-4 py-3 border-b border-slate-200 text-sm font-medium text-slate-700">목록</div>
                <div className="p-3 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="text-left px-3 py-2 border-b border-slate-200">시간</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">NGW ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Logger Name</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Log Level</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Thread</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">NODE ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Class</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">GUID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">메시지</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r, idx) => (
                            <tr key={`${r.time}-${idx}`} className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50">
                                <td className="px-3 py-2 border-b border-slate-200 whitespace-nowrap">{r.time}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.ngwId}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.loggerName}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.logLevel}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.thread}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.nodeId}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.className}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.guid}</td>
                                <td className="px-3 py-2 border-b border-slate-200">
                                    <div className="max-w-[36rem] truncate" title={r.message}>
                                        {r.message}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
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

                    {/* 우: 자리 맞춤 */}
                    <div />
                </div>
            </div>
        </div>
    );
}

import { useMemo, useState } from "react";
import StatusBadge from "@shared/ui/StatusBadge.tsx";

type Row = { id: number; name: string; status: "ACTIVE" | "INACTIVE" | "PENDING"; createdAt: string };

const seed: Row[] = Array.from({ length: 73 }).map((_, i) => ({
    id: 1000 + i,
    name: `Sample Item ${i + 1}`,
    status: (["ACTIVE", "INACTIVE", "PENDING"] as const)[i % 3],
    createdAt: new Date(2024, 6, (i % 28) + 1, 9, 30).toISOString(),
}));

export default function HomePage() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"ALL" | Row["status"]>("ALL");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        return seed.filter((r) => {
            const okQ = q ? r.name.toLowerCase().includes(q.toLowerCase()) : true;
            const okS = status === "ALL" ? true : r.status === status;
            return okQ && okS;
        });
    }, [q, status]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const paged = useMemo(() => {
        const start = safePage * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800">Items</h1>
                <div className="text-xs text-slate-500">총 {filtered.length}건</div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">키워드</label>
                    <input
                        value={q}
                        onChange={(e) => { setPage(0); setQ(e.target.value); }}
                        className="border border-slate-300 rounded px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="검색어"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs mb-1 text-slate-600">상태</label>
                    <select
                        value={status}
                        onChange={(e) => { setPage(0); setStatus(e.target.value as any); }}
                        className="border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">ALL</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                </div>
                <button
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm shadow-sm"
                    onClick={() => setPage(0)}
                >
                    검색
                </button>
                <button
                    className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-100 text-sm"
                    onClick={() => { setQ(""); setStatus("ALL"); setPage(0); }}
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
                            <th className="text-left px-3 py-2 border-b border-slate-200">ID</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Name</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Status</th>
                            <th className="text-left px-3 py-2 border-b border-slate-200">Created</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paged.map((r) => (
                            <tr key={r.id} className={`odd:bg-white even:bg-slate-50 hover:bg-indigo-50`}>
                                <td className="px-3 py-2 border-b border-slate-200">{r.id}</td>
                                <td className="px-3 py-2 border-b border-slate-200">{r.name}</td>
                                <td className="px-3 py-2 border-b border-slate-200"><StatusBadge value={r.status} /></td>
                                <td className="px-3 py-2 border-b border-slate-200">{new Date(r.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-3 py-10 text-center text-slate-500">결과가 없습니다.</td>
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
                            onChange={(e) => { setPage(0); setPageSize(parseInt(e.target.value, 10)); }}
                        >
                            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                                onClick={() => setPage(0)} disabled={safePage === 0}>《</button>
                        <button className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                                onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}>〈</button>
                        <span className="text-slate-700">{safePage + 1} / {totalPages}</span>
                        <button className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={safePage >= totalPages - 1}>〉</button>
                        <button className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                                onClick={() => setPage(totalPages - 1)}
                                disabled={safePage >= totalPages - 1}>》</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

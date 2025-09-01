export interface LogRow {
    time: string;
    ngwId: string;
    loggerName: string;
    logLevel: string;
    thread: string;
    nodeId: string;
    className: string;
    guid: string;
    message: string;
}

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export async function fetchLoggers(): Promise<string[]> {
    const r = await fetch("/api/logs/loggers", { credentials: "include" });
    if (!r.ok) throw new Error("logger 목록 조회 실패");
    return r.json();
}

export async function fetchGuids(limit = 20): Promise<string[]> {
    const r = await fetch(`/api/logs/guids?limit=${limit}`, { credentials: "include" });
    if (!r.ok) throw new Error("GUID 목록 조회 실패");
    return r.json();
}

/** ✅ logger 단일 선택 버전 */
export async function fetchLogs(params: {
    guid?: string;
    logger?: string;   // ← string[] -> string
    page?: number;
    size?: number;
}): Promise<Page<LogRow>> {
    const q = new URLSearchParams();
    if (params.guid) q.set("guid", params.guid);
    if (params.logger) q.set("logger", params.logger);   // ← 단일 값
    q.set("page", String(params.page ?? 0));
    q.set("size", String(params.size ?? 10));

    const r = await fetch(`/api/logs?${q.toString()}`, { credentials: "include" });
    if (!r.ok) throw new Error("로그 조회 실패");
    return r.json();
}
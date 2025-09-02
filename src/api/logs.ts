export interface LogRow {
    time: string; ngwId: string; loggerName: string; logLevel: string;
    thread: string; nodeId: string; className: string; guid: string; message: string;
}
export interface Page<T> {
    content: T[]; totalElements: number; totalPages: number; number: number; size: number;
}

export async function fetchLogs(params: {
    guid?: string; logger?: string; page?: number; size?: number;
}): Promise<Page<LogRow>> {
    const payload = {
        guid: params.guid ?? null,
        logger: params.logger ?? null,
        page: params.page ?? 0,
        size: params.size ?? 10,
    };
    const r = await fetch(`/api/logs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`로그 조회 실패 (${r.status})`);
    return r.json();
}
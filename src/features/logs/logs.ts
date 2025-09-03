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

export interface FetchLogsParams {
    guid?: string;
    logger?: string;
    page?: number;
    size?: number;
}

export async function fetchLogs(params: FetchLogsParams): Promise<Page<LogRow>> {
    const res = await fetch("/api/logs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            guid: params.guid ?? null,
            logger: params.logger ?? null,
            page: params.page ?? 0,
            size: params.size ?? 10,
        }),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `fetchLogs failed (${res.status})`);
    }
    return res.json();
}
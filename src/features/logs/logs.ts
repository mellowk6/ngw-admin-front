import { apiFetch } from "@core/http/client";

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

export async function fetchLogs(params: FetchLogsParams = {}): Promise<Page<LogRow>> {
    const body = {
        guid: params.guid ?? null,
        logger: params.logger ?? null,
        page: params.page ?? 0,
        size: params.size ?? 10,
    };

    // ✅ 변경: apiFetchJson -> apiFetch
    return apiFetch<Page<LogRow>>("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}
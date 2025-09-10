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
    number: number; // 0-based
    size: number;
}

export interface FetchLogsParams {
    guid?: string;
    logger?: string;
    page?: number; // 0-based
    size?: number;
}

// 서버에서 내려오는 필드 케이스/이름 차이를 화면용으로 매핑
function mapRow(x: any): LogRow {
    return {
        time:       x?.time ?? x?.timestamp ?? "",
        ngwId:      x?.ngwId ?? x?.ngw_id ?? "",
        loggerName: x?.loggerName ?? x?.logger_name ?? x?.logger ?? "",
        logLevel:   x?.logLevel ?? x?.level ?? "",
        thread:     x?.thread ?? x?.thread_name ?? "",
        nodeId:     x?.nodeId ?? x?.node_id ?? "",
        className:  x?.className ?? x?.class ?? x?.class_name ?? "",
        guid:       x?.guid ?? x?.GUID ?? "",
        message:    x?.message ?? x?.msg ?? "",
    };
}

// 어떤 포맷이 와도 Page<LogRow>로 정규화
function normalizePage(raw: any, page = 0, size = 10): Page<LogRow> {
    // apiFetch 가 {data: ...}를 언패킹하지만, 혹시 모를 이중 대비
    const d = raw?.data ?? raw;

    const listSource = d?.content ?? d?.items ?? d?.list ?? [];
    const content: LogRow[] = (Array.isArray(listSource) ? listSource : []).map(mapRow);

    const totalElements =
        d?.totalElements ?? d?.total ?? d?.count ?? content.length ?? 0;

    const totalPages =
        d?.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

    const number = typeof d?.number === "number" ? d.number : page;
    const pageSize = typeof d?.size === "number" ? d.size : size;

    return { content, totalElements, totalPages, number, size: pageSize };
}

export async function fetchLogs(params: FetchLogsParams = {}): Promise<Page<LogRow>> {
    const page = params.page ?? 0;
    const size = params.size ?? 10;

    // 값이 있을 때만 보냄(null/undefined 전송 지양)
    const body: Record<string, any> = { page, size };
    if (params.guid?.trim()) body.guid = params.guid.trim();
    if (params.logger) body.logger = params.logger;

    const raw = await apiFetch<any>("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    return normalizePage(raw, page, size);
}

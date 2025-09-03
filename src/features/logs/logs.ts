import {apiFetch} from "@core/http/client";
import {FetchLogsParams, LogRow, Page} from "@features/logs/types";

export async function fetchLogs(params: FetchLogsParams): Promise<Page<LogRow>> {
    const res = await apiFetch("/api/logs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
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
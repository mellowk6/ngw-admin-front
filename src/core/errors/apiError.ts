export class ApiError extends Error {
    status: number;
    body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

export async function toApiError(resp: Response): Promise<ApiError> {
    const text = await resp.text().catch(() => "");
    return new ApiError(text || resp.statusText || "Request failed", resp.status);
}
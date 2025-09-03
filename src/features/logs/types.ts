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
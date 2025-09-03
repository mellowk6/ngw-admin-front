import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ROUTES } from "@/app/constants/routes";

type Props = { status?: number };

export default function ErrorPage({ status: forcedStatus }: Props = {}) {
    const err = useRouteError();

    let title = "문제가 발생했어요";
    let desc = "요청을 처리하던 중 오류가 발생했습니다.";
    let status = forcedStatus ?? 500;
    let statusText: string | undefined;

    // 라우터가 전달한 에러 응답일 경우
    if (isRouteErrorResponse(err)) {
        status = forcedStatus ?? err.status;
        statusText = err.statusText;
        if (status === 404) {
            title = "페이지를 찾을 수 없어요 (404)";
            desc = "주소가 잘못되었거나, 페이지가 이동/삭제되었을 수 있어요.";
        } else {
            title = `요청 실패 (${status})`;
            desc = statusText || desc;
        }
    }

    // 최소 한 줄은 항상 보이는 간단한 디버그 메시지
    const debugLine =
        isRouteErrorResponse(err)
            ? `HTTP ${status} - ${statusText || "Error"}`
            : err instanceof Error
                ? `${err.name}: ${err.message}`
                : forcedStatus
                    ? `HTTP ${forcedStatus} - ${
                        forcedStatus === 404 ? "Not Found" : "Error"
                    }`
                    : "에러 상세가 없습니다.";

    const isDev = import.meta.env.DEV;

    // 개발 모드에서만 상세 출력하되, null/undefined/빈 객체·배열이면 숨김
    const rawDetail = isDev ? safeSerialize(err) : "";
    const trimmed = rawDetail?.trim();
    const hasDetail =
        !!trimmed &&
        trimmed !== "null" &&
        trimmed !== "undefined" &&
        trimmed !== "{}" &&
        trimmed !== "[]";

    return (
        <div className="p-10 text-slate-800">
            <h1 className="text-2xl font-semibold mb-2">{title}</h1>
            <p className="mb-6 text-slate-600">{desc}</p>

            <div className="flex gap-2">
                <Link
                    to={ROUTES.app}
                    className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    메인으로
                </Link>
                <Link
                    to={ROUTES.logs}
                    className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-100"
                >
                    로그 조회로
                </Link>
            </div>

            {/* 항상 최소 한 줄은 보여주고, 개발 모드면 상세 JSON도 추가(무의미한 값은 숨김) */}
            <pre className="mt-8 p-3 bg-slate-50 text-xs text-slate-600 rounded border border-slate-200 overflow-auto">
        {debugLine}
                {hasDetail ? "\n\n" + rawDetail : ""}
      </pre>
        </div>
    );
}

/** JSON.stringify가 실패할 수 있는 케이스를 대비한 안전 직렬화 */
function safeSerialize(err: unknown): string {
    try {
        return JSON.stringify(err, null, 2);
    } catch {
        if (err instanceof Error) {
            return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
        }
        return String(err);
    }
}
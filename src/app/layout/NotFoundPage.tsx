import { Link } from "react-router-dom";
import { ROUTES } from "@/app/constants/routes";

export default function NotFoundPage() {
    return (
        <div className="p-10 text-slate-800">
            <h1 className="text-2xl font-semibold mb-2">페이지를 찾을 수 없어요 (404)</h1>
            <p className="mb-6 text-slate-600">주소가 올바른지 확인해 주세요.</p>
            <Link
                to={ROUTES.app}
                className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
                대시보드로
            </Link>
        </div>
    );
}
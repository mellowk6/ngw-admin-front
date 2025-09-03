import { NavLink } from "react-router-dom";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
        {/* 대분류: 색/배경 지정 X, 부모 색을 상속. 톤만 살짝 낮춤 */}
        <div className="px-2 py-1 text-[11px] font-semibold opacity-70">{title}</div>
        <div className="flex flex-col">{children}</div>
    </div>
);

export default function Sidebar() {
    const item = (to: string, label: string) => (
        <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
                [
                    "px-3 py-2 text-sm rounded",
                    // 부모가 다크면 이 톤이 자연스럽게 섞입니다
                    "hover:bg-white/10",               // 살짝 밝게
                    isActive ? "bg-white/15 font-medium" : "opacity-90",
                    "transition-colors"
                ].join(" ")
            }
            end
        >
            {label}
        </NavLink>
    );

    return (
        // ❗ 배경/테두리 지정하지 않습니다. (AppShell 이 지정)
        <nav className="w-56 p-2">
            <Section title="ADMIN 관리">
                {item("/app/admin/users", "사용자 관리")}
                {item("/app/admin/roles", "권한 관리")}
                {item("/app/admin/menus", "메뉴 관리")}
            </Section>

            <Section title="NGW 관리">
                {item("/app/ngw/instances", "instance 관리")}
            </Section>

            <Section title="로그 관리">
                {item("/app/logs", "로그 조회")}
                {item("/app/logs/level", "로그 레벨 변경")}
                {item("/app/sample", "샘플페이지")}
            </Section>

            <Section title="프로퍼티">
                {item("/app/props", "프로퍼티 관리")}
                {item("/app/props/reload", "프로퍼티 리로드")}
            </Section>

            <Section title="모니터링">
                {item("/app/monitor/overall", "전체 통계")}
                {item("/app/monitor/ngw", "NGW 통계")}
                {item("/app/monitor/node", "노드 상세")}
            </Section>
        </nav>
    );
}
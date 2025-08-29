type S = "ACTIVE" | "INACTIVE" | "PENDING";
export default function StatusBadge({ value }: { value: S }) {
    const map: Record<S, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        INACTIVE: "bg-rose-100 text-rose-700 border border-rose-200",
        PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs ${map[value]}`}>{value}</span>;
}

import { LucideIcon } from "lucide-react";

type StatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "trust" | "lagoon" | "amber";
};

const toneClass = {
  trust: "bg-trust text-white",
  lagoon: "bg-lagoon text-white",
  amber: "bg-amber text-ink"
};

export function Stat({ icon: Icon, label, value, tone = "trust" }: StatProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass[tone]}`}>
          <Icon size={19} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

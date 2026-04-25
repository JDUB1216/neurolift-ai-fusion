import { cn } from "@/lib/utils";

type Status = "active" | "completed" | "failed" | "paused" | "idle" | "attempting" | "struggling" | "learning" | "independent" | "burnout";
type RiskLevel = "low" | "medium" | "high" | "critical";

const statusConfig: Record<string, { label: string; className: string; dot?: string }> = {
  active:       { label: "Active",       className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  completed:    { label: "Completed",    className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  failed:       { label: "Failed",       className: "bg-red-500/15 text-red-400 border-red-500/30" },
  paused:       { label: "Paused",       className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  idle:         { label: "Idle",         className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  attempting:   { label: "Attempting",   className: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  struggling:   { label: "Struggling",   className: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
  learning:     { label: "Learning",     className: "bg-teal-500/15 text-teal-400 border-teal-500/30", dot: "bg-teal-400" },
  independent:  { label: "Independent",  className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  burnout:      { label: "Burnout",      className: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
};

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low:      { label: "Low",      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  medium:   { label: "Medium",   className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  high:     { label: "High",     className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critical: { label: "Critical", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {showDot && config.dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full status-pulse", config.dot)} />
      )}
      {config.label}
    </span>
  );
}

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const config = riskConfig[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
      {score !== undefined && (
        <span className="opacity-70">({(score * 100).toFixed(0)}%)</span>
      )}
    </span>
  );
}

interface MetricBarProps {
  value: number; // 0–1
  label?: string;
  colorClass?: string;
  className?: string;
}

export function MetricBar({ value, label, colorClass = "bg-primary", className }: MetricBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 flex flex-col gap-3 transition-colors",
        accent
          ? "border-primary/30 bg-primary/5"
          : danger
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className={cn("opacity-60", accent ? "text-primary" : danger ? "text-destructive" : "text-muted-foreground")}>{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("text-3xl font-semibold tracking-tight", accent ? "text-primary" : danger ? "text-destructive" : "text-foreground")}>
          {value}
        </span>
        {sub && <span className="text-sm text-muted-foreground mb-0.5">{sub}</span>}
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { RiskBadge, MetricBar } from "@/components/StatusBadge";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const riskColors: Record<string, string> = {
  low: "oklch(0.72 0.18 145)",
  medium: "oklch(0.72 0.20 55)",
  high: "oklch(0.65 0.22 25)",
  critical: "oklch(0.60 0.22 25)",
};

const avatarColors = [
  "oklch(0.62 0.22 265)",
  "oklch(0.68 0.18 195)",
  "oklch(0.72 0.18 145)",
  "oklch(0.72 0.20 55)",
  "oklch(0.65 0.22 15)",
];

export default function BurnoutMonitor() {
  const { data: latestPerAvatar, isLoading: latestLoading } = trpc.burnout.latestPerAvatar.useQuery();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const { data: history, isLoading: historyLoading } = trpc.burnout.list.useQuery(
    { avatarId: selectedAvatar ?? undefined, limit: 100 },
    { enabled: true }
  );

  // Build trend chart data grouped by date
  const allAvatarIds = Array.from(new Set((history ?? []).map((h) => h.avatarId)));

  const trendByDate: Record<string, Record<string, number>> = {};
  for (const h of history ?? []) {
    const date = new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!trendByDate[date]) trendByDate[date] = {};
    // Average if multiple per day
    if (trendByDate[date][h.avatarId] === undefined) {
      trendByDate[date][h.avatarId] = h.riskScore;
    } else {
      trendByDate[date][h.avatarId] = (trendByDate[date][h.avatarId] + h.riskScore) / 2;
    }
  }

  const chartData = Object.entries(trendByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, scores]) => ({ date, ...scores }));

  const displayAvatars = selectedAvatar
    ? allAvatarIds.filter((id) => id === selectedAvatar)
    : allAvatarIds;

  const getTrend = (avatarId: string): "up" | "down" | "stable" => {
    const avatarHistory = (history ?? [])
      .filter((h) => h.avatarId === avatarId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (avatarHistory.length < 2) return "stable";
    const first = avatarHistory[0].riskScore;
    const last = avatarHistory[avatarHistory.length - 1].riskScore;
    if (last - first > 0.05) return "up";
    if (first - last > 0.05) return "down";
    return "stable";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <AlertTriangle size={22} className="text-amber-400" />
          Burnout Monitor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track burnout risk levels and trends across all avatars
        </p>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {latestLoading ? (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">Loading...</div>
        ) : (
          (latestPerAvatar ?? []).map((b) => {
            const trend = getTrend(b.avatarId);
            return (
              <button
                key={b.avatarId}
                onClick={() => setSelectedAvatar(b.avatarId === selectedAvatar ? null : b.avatarId)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all duration-150",
                  selectedAvatar === b.avatarId
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{b.avatarId}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {trend === "up" && <TrendingUp size={12} className="text-destructive" />}
                      {trend === "down" && <TrendingDown size={12} className="text-emerald-400" />}
                      {trend === "stable" && <Minus size={12} className="text-muted-foreground" />}
                      <span className="text-[10px] text-muted-foreground capitalize">{trend}</span>
                    </div>
                  </div>
                  <RiskBadge level={b.riskLevel as any} />
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Risk Score</span>
                    <span className="font-medium">{(b.riskScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${b.riskScore * 100}%`,
                        background: riskColors[b.riskLevel] ?? riskColors.medium,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Stress</span>
                    <span>{((b.stressLevel ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Cog. Load</span>
                    <span>{((b.cognitiveLoad ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Emotional</span>
                    <span className="capitalize">{b.emotionalState}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Burnout Risk Trends
            {selectedAvatar && <span className="text-muted-foreground font-normal ml-2">— {selectedAvatar}</span>}
          </h2>
          {selectedAvatar && (
            <button
              onClick={() => setSelectedAvatar(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Show all
            </button>
          )}
        </div>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                axisLine={{ stroke: "oklch(0.22 0.015 260)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.012 260)",
                  border: "1px solid oklch(0.22 0.015 260)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: number, name: string) => [`${(v * 100).toFixed(0)}%`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                formatter={(value) => <span style={{ color: "oklch(0.55 0.01 260)" }}>{value}</span>}
              />
              {displayAvatars.map((avatarId, i) => (
                <Line
                  key={avatarId}
                  type="monotone"
                  dataKey={avatarId}
                  stroke={avatarColors[i % avatarColors.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: avatarColors[i % avatarColors.length] }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recommendations for selected avatar */}
      {selectedAvatar && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Latest Recommendations — {selectedAvatar}</h2>
          {(() => {
            const latest = (latestPerAvatar ?? []).find((b) => b.avatarId === selectedAvatar);
            if (!latest) return <p className="text-sm text-muted-foreground">No data</p>;
            let recs: string[] = [];
            try { recs = JSON.parse(latest.recommendations ?? "[]"); } catch {}
            return (
              <div className="space-y-2">
                {recs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recommendations available</p>
                ) : recs.map((r, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-accent/40 border border-border/50">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-semibold text-amber-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground">{r}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const metricTypes = [
  { value: "session_success_rate", label: "Session Success Rate" },
  { value: "session_quality", label: "Session Quality" },
  { value: "burnout_risk", label: "Burnout Risk" },
  { value: "independence_level", label: "Independence Level" },
];

const avatarColors = [
  "oklch(0.62 0.22 265)",
  "oklch(0.68 0.18 195)",
  "oklch(0.72 0.18 145)",
  "oklch(0.72 0.20 55)",
  "oklch(0.65 0.22 15)",
];

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.13 0.012 260)",
    border: "1px solid oklch(0.22 0.015 260)",
    borderRadius: "8px",
    fontSize: "12px",
  },
};

export default function Analytics() {
  const { data: avatars } = trpc.avatars.list.useQuery();
  const [selectedMetric, setSelectedMetric] = useState("session_success_rate");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("all");

  const { data: metrics, isLoading } = trpc.analytics.metrics.useQuery({
    metricType: selectedMetric,
    avatarId: selectedAvatar !== "all" ? selectedAvatar : undefined,
    limit: 200,
  });

  const { data: progressData } = trpc.avatars.progress.useQuery(
    { avatarId: selectedAvatar !== "all" ? selectedAvatar : (avatars?.[0]?.avatarId ?? "") },
    { enabled: !!(selectedAvatar !== "all" ? selectedAvatar : avatars?.[0]?.avatarId) }
  );

  const { data: sessions } = trpc.sessions.list.useQuery();

  // Build time-series chart data
  const allAvatarIds = Array.from(new Set((metrics ?? []).map((m) => m.avatarId ?? "unknown")));

  const byDate: Record<string, Record<string, number>> = {};
  for (const m of metrics ?? []) {
    const date = new Date(m.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const avatarKey = m.avatarId ?? "unknown";
    if (!byDate[date]) byDate[date] = {};
    byDate[date][avatarKey] = m.metricValue;
  }

  const chartData = Object.entries(byDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, vals]) => ({ date, ...vals }));

  // Session quality bar chart
  const sessionQualityData = (sessions ?? [])
    .filter((s) => s.status === "completed" && s.averageQualityScore)
    .slice(-10)
    .map((s) => ({
      name: s.scenarioName?.split(" ").slice(0, 2).join(" ") ?? s.sessionId.slice(0, 8),
      quality: parseFloat(((s.averageQualityScore ?? 0) * 100).toFixed(1)),
      tasks: s.totalAttempts,
      success: s.successfulAttempts,
    }));

  // Task type progress (bar chart)
  const taskProgressData = (progressData ?? []).map((p) => ({
    task: p.taskType?.replace(/-/g, " ") ?? "Unknown",
    successRate: parseFloat(((p.successRate ?? 0) * 100).toFixed(1)),
    independence: parseFloat(((p.independenceLevel ?? 0) * 100).toFixed(1)),
    attempts: p.attempts,
  }));

  const displayAvatars = selectedAvatar !== "all"
    ? allAvatarIds.filter((id) => id === selectedAvatar)
    : allAvatarIds;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 size={22} className="text-primary" />
          Progress Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize learning progress, quality scores, and independence levels over time
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-52 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {metricTypes.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
          <SelectTrigger className="w-48 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Avatars</SelectItem>
            {(avatars ?? []).map((a) => (
              <SelectItem key={a.avatarId} value={a.avatarId}>{a.traitName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metric Trend Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">
          {metricTypes.find((m) => m.value === selectedMetric)?.label ?? "Metric"} — 14-Day Trend
        </h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {displayAvatars.map((id, i) => (
                  <linearGradient key={id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={avatarColors[i % avatarColors.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={avatarColors[i % avatarColors.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.22 0.015 260)" }} tickLine={false} />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v: number, name: string) => [`${(v * 100).toFixed(1)}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} formatter={(v) => <span style={{ color: "oklch(0.55 0.01 260)" }}>{v}</span>} />
              {displayAvatars.map((id, i) => (
                <Area
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stroke={avatarColors[i % avatarColors.length]}
                  fill={`url(#grad-${i})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Quality Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Session Quality Scores</h2>
          {sessionQualityData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No completed sessions</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sessionQualityData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Quality"]} />
                <Bar dataKey="quality" fill="oklch(0.62 0.22 265)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task Success Rate Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-1">Task Success & Independence</h2>
          <p className="text-xs text-muted-foreground mb-4">
            {selectedAvatar !== "all"
              ? avatars?.find((a) => a.avatarId === selectedAvatar)?.traitName
              : avatars?.[0]?.traitName ?? "Select an avatar"}
          </p>
          {taskProgressData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No task data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskProgressData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                <XAxis dataKey="task" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name === "successRate" ? "Success Rate" : "Independence"]} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} formatter={(v) => <span style={{ color: "oklch(0.55 0.01 260)" }}>{v === "successRate" ? "Success Rate" : "Independence"}</span>} />
                <Bar dataKey="successRate" fill="oklch(0.62 0.22 265)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="independence" fill="oklch(0.72 0.18 145)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Avatar Summary Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Avatar Performance Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avatar</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Success Rate</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Independence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Coaching</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(avatars ?? []).map((avatar) => {
                const successRate = avatar.totalTasksAttempted
                  ? (avatar.totalTasksCompleted ?? 0) / avatar.totalTasksAttempted
                  : 0;
                return (
                  <tr key={avatar.avatarId} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-foreground">{avatar.traitName}</p>
                        <p className="text-xs text-muted-foreground">{avatar.avatarId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        <span className="text-emerald-400">{avatar.totalTasksCompleted}</span>
                        <span className="text-muted-foreground">/{avatar.totalTasksAttempted}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${successRate * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{(successRate * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(avatar.independenceLevel ?? 0) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{((avatar.independenceLevel ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{avatar.totalCoachingSessions} sessions</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

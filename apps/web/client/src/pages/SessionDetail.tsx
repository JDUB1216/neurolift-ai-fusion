import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Clock, Target, Zap } from "lucide-react";
import { Link, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const coachingTypeColors: Record<string, string> = {
  preventive: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  reactive: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  crisis: "text-red-400 bg-red-500/10 border-red-500/20",
  recovery: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  independence_building: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const urgencyColors: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export default function SessionDetail() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const { data: session, isLoading: sessionLoading } = trpc.sessions.get.useQuery({ sessionId });
  const { data: taskResults, isLoading: tasksLoading } = trpc.sessions.taskResults.useQuery({ sessionId });
  const { data: coachingActions, isLoading: coachingLoading } = trpc.sessions.coachingActions.useQuery({ sessionId });

  if (sessionLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-96">
        <div className="text-sm text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Session not found</p>
          <Link href="/sessions">
            <Button variant="outline" size="sm" className="mt-4">Back to Sessions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const successRate = session.totalAttempts
    ? (session.successfulAttempts ?? 0) / session.totalAttempts
    : 0;

  // Task quality chart data
  const taskChartData = (taskResults ?? []).map((t, i) => ({
    task: `#${i + 1}`,
    quality: parseFloat(((t.qualityScore ?? 0) * 100).toFixed(1)),
    success: t.success ? 1 : 0,
  }));

  // Coaching type distribution
  const coachingDist: Record<string, number> = {};
  for (const c of coachingActions ?? []) {
    coachingDist[c.coachingType] = (coachingDist[c.coachingType] ?? 0) + 1;
  }
  const coachingChartData = Object.entries(coachingDist).map(([type, count]) => ({
    type: type.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/sessions">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={14} />
            Back to Sessions
          </button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {session.scenarioName ?? "Training Session"}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>Avatar: <span className="text-foreground/70">{session.avatarId}</span></span>
              <span>·</span>
              <span>Aide: <span className="text-foreground/70">{session.aideId}</span></span>
              <span>·</span>
              <span>{new Date(session.startTime).toLocaleString()}</span>
            </div>
          </div>
          <StatusBadge status={session.status} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: session.totalAttempts ?? 0, icon: <Target size={15} /> },
          { label: "Successful", value: session.successfulAttempts ?? 0, icon: <CheckCircle2 size={15} />, accent: true },
          { label: "Quality Score", value: `${((session.averageQualityScore ?? 0) * 100).toFixed(0)}%`, icon: <Zap size={15} /> },
          {
            label: "Duration",
            value: session.durationSeconds
              ? `${Math.floor(session.durationSeconds / 60)}m ${session.durationSeconds % 60}s`
              : session.status === "active" ? "Live" : "—",
            icon: <Clock size={15} />,
          },
        ].map((stat) => (
          <div key={stat.label} className={cn(
            "rounded-xl border p-4",
            stat.accent ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-card"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn("opacity-50", stat.accent ? "text-emerald-400" : "text-muted-foreground")}>
                {stat.icon}
              </span>
            </div>
            <p className={cn("text-2xl font-semibold", stat.accent ? "text-emerald-400" : "text-foreground")}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Quality Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Task Quality Scores</h2>
          {taskChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No task data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" />
                <XAxis dataKey="task" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.012 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [`${v}%`, "Quality"]}
                />
                <Bar dataKey="quality" fill="oklch(0.62 0.22 265)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Coaching Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Coaching Action Types</h2>
          {coachingChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No coaching data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coachingChartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 260)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.012 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="oklch(0.68 0.18 195)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Task Results */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Task Results</h2>
        </div>
        <div className="divide-y divide-border">
          {tasksLoading ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (taskResults ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No task results recorded</div>
          ) : (
            (taskResults ?? []).map((task, i) => {
              let struggles: string[] = [];
              try { struggles = JSON.parse(task.struggleIndicators ?? "[]"); } catch {}
              return (
                <div key={task.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {task.success ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : (
                          <XCircle size={16} className="text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground capitalize">
                          {task.taskType?.replace(/-/g, " ") ?? "Task"} #{i + 1}
                        </p>
                        {struggles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {struggles.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive border border-destructive/20">
                                {s.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{((task.qualityScore ?? 0) * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-muted-foreground">quality</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coaching Actions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare size={15} className="text-primary" />
            Coaching Actions
          </h2>
        </div>
        <div className="divide-y divide-border">
          {coachingLoading ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : (coachingActions ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No coaching actions recorded</div>
          ) : (
            (coachingActions ?? []).map((action) => (
              <div key={action.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 mt-0.5 capitalize",
                    coachingTypeColors[action.coachingType] ?? "text-muted-foreground bg-muted border-border"
                  )}>
                    {action.coachingType.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground">{action.strategy}</span>
                      <span className={cn("text-[10px] capitalize", urgencyColors[action.urgency])}>
                        {action.urgency} urgency
                      </span>
                      {action.wasEffective !== null && action.wasEffective !== undefined && (
                        <span className={cn("text-[10px]", action.wasEffective ? "text-emerald-400" : "text-muted-foreground")}>
                          {action.wasEffective ? "✓ Effective" : "✗ Ineffective"}
                        </span>
                      )}
                    </div>
                    {action.message && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{action.message}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

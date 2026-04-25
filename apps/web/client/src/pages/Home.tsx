import { trpc } from "@/lib/trpc";
import { StatCard, StatusBadge, RiskBadge } from "@/components/StatusBadge";
import { Activity, AlertTriangle, Brain, Users, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: sessions, isLoading: sessionsLoading } = trpc.sessions.list.useQuery();
  const { data: burnoutLatest, isLoading: burnoutLoading } = trpc.burnout.latestPerAvatar.useQuery();
  const { data: avatars } = trpc.avatars.list.useQuery();

  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];
  const criticalBurnout = burnoutLatest?.filter((b) => b.riskLevel === "critical" || b.riskLevel === "high") ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          NeuroLift AI Fusion — Avatar-Aide training simulation platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Sessions"
          value={statsLoading ? "—" : stats?.activeSessions ?? 0}
          icon={<Activity size={16} />}
          accent
        />
        <StatCard
          label="Total Avatars"
          value={statsLoading ? "—" : stats?.totalAvatars ?? 0}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Total Aides"
          value={statsLoading ? "—" : stats?.totalAides ?? 0}
          icon={<Brain size={16} />}
        />
        <StatCard
          label="Fusion Ready"
          value={statsLoading ? "—" : stats?.fusionReadyCount ?? 0}
          sub="avatars"
          icon={<Zap size={16} />}
          accent
        />
        <StatCard
          label="High Burnout Risk"
          value={statsLoading ? "—" : stats?.highBurnoutCount ?? 0}
          sub="avatars"
          icon={<AlertTriangle size={16} />}
          danger={(stats?.highBurnoutCount ?? 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Active Sessions</h2>
            </div>
            <Link href="/sessions">
              <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors">
                View all <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {sessionsLoading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : activeSessions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No active sessions</p>
                <Link href="/sessions">
                  <span className="text-xs text-primary hover:underline cursor-pointer mt-1 block">
                    Start a new session
                  </span>
                </Link>
              </div>
            ) : (
              activeSessions.slice(0, 5).map((session) => (
                <Link key={session.sessionId} href={`/sessions/${session.sessionId}`}>
                  <div className="px-5 py-3.5 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.scenarioName ?? "Training Session"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.avatarId} × {session.aideId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {session.totalAttempts} tasks
                        </span>
                        <StatusBadge status={session.status} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Burnout Risk Panel */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">Burnout Risk Overview</h2>
            </div>
            <Link href="/burnout">
              <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors">
                View all <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {burnoutLoading ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : burnoutLatest?.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No assessments available</div>
            ) : (
              (burnoutLatest ?? []).slice(0, 5).map((b) => (
                <div key={b.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.avatarId}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stress {((b.stressLevel ?? 0) * 100).toFixed(0)}% · Load {((b.cognitiveLoad ?? 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <RiskBadge level={b.riskLevel as any} score={b.riskScore} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Avatar Quick Overview */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Avatar Status Overview</h2>
          </div>
          <Link href="/avatars">
            <span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors">
              Manage avatars <ArrowRight size={12} />
            </span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Avatar</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">State</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Emotional</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Independence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Burnout Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(avatars ?? []).slice(0, 5).map((avatar) => (
                <tr key={avatar.avatarId} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-foreground">{avatar.traitName}</p>
                      <p className="text-xs text-muted-foreground">{avatar.avatarId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={avatar.currentState} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground capitalize">{avatar.emotionalState}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(avatar.independenceLevel ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((avatar.independenceLevel ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={avatar.burnoutRiskLevel as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

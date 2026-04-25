import { trpc } from "@/lib/trpc";
import { MetricBar } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2, Sparkles, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const dimensionLabels: Record<string, string> = {
  independence: "Independence",
  task_mastery: "Task Mastery",
  emotional_regulation: "Emotional Regulation",
  aide_effectiveness: "Aide Effectiveness",
  session_quality: "Session Quality",
};

const empathyColors: Record<string, string> = {
  surface: "text-slate-400",
  experiential: "text-blue-400",
  deep: "text-indigo-400",
  transformative: "text-purple-400",
};

export default function FusionEngine() {
  const { data: avatars } = trpc.avatars.list.useQuery();
  const { data: aides } = trpc.aides.list.useQuery();
  const { data: fusionHistory, refetch: refetchHistory } = trpc.fusion.list.useQuery();

  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [selectedAide, setSelectedAide] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: readiness, isLoading: readinessLoading, refetch: refetchReadiness } = trpc.fusion.assessReadiness.useQuery(
    { avatarId: selectedAvatar, aideId: selectedAide },
    { enabled: !!selectedAvatar && !!selectedAide }
  );

  const triggerMutation = trpc.fusion.trigger.useMutation({
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(`Fusion successful! ${result.advocateName} created.`);
      } else {
        toast.error(`Fusion failed: ${result?.failureReason}`);
      }
      refetchHistory();
    },
    onError: (e) => toast.error(e.message),
  });

  const radarData = readiness
    ? Object.entries(readiness.dimensions).map(([key, val]) => ({
        dimension: dimensionLabels[key] ?? key,
        value: Math.round(val * 100),
        fullMark: 100,
      }))
    : [];

  const parseScores = (raw: string | null | undefined): Record<string, number> => {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Zap size={22} className="text-primary" />
          Fusion Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assess Avatar-Aide fusion readiness and create Advocates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">Select Pair</h2>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Avatar</label>
              <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Choose an avatar..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(avatars ?? []).map((a) => (
                    <SelectItem key={a.avatarId} value={a.avatarId}>
                      {a.traitName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Aide</label>
              <Select value={selectedAide} onValueChange={setSelectedAide}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Choose an aide..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(aides ?? []).map((a) => (
                    <SelectItem key={a.aideId} value={a.aideId}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {readiness && (
              <div className="pt-2 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Readiness</span>
                  <span className={cn("text-2xl font-bold", readiness.isReady ? "text-emerald-400" : "text-amber-400")}>
                    {(readiness.overallScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg text-sm",
                  readiness.isReady
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                )}>
                  {readiness.isReady ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {readiness.isReady ? "Ready for Fusion" : "Not Ready Yet"}
                </div>

                {readiness.blockers.length > 0 && (
                  <div className="space-y-1.5">
                    {readiness.blockers.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <XCircle size={12} className="text-destructive shrink-0 mt-0.5" />
                        {b}
                      </div>
                    ))}
                  </div>
                )}

<Button
                  className="w-full gap-2"
                  disabled={!readiness.isReady || triggerMutation.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Sparkles size={15} />
                  {triggerMutation.isPending ? "Fusing..." : "Trigger Fusion"}
                </Button>

                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Sparkles size={18} className="text-primary" />
                        Confirm Fusion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This will attempt to fuse the selected Avatar and Aide into an Advocate.
                        The process is irreversible. Readiness score:{" "}
                        <strong className="text-foreground">{((readiness.overallScore ?? 0) * 100).toFixed(0)}%</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setConfirmOpen(false);
                          triggerMutation.mutate({ avatarId: selectedAvatar, aideId: selectedAide });
                        }}
                      >
                        Proceed with Fusion
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {!selectedAvatar || !selectedAide ? (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Select both an Avatar and Aide to assess readiness
              </p>
            ) : null}
          </div>

          {/* Dimension Scores */}
          {readiness && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold">Dimension Scores</h2>
              {Object.entries(readiness.dimensions).map(([key, val]) => (
                <MetricBar
                  key={key}
                  label={dimensionLabels[key] ?? key}
                  value={val}
                  colorClass={val >= 0.7 ? "bg-emerald-400" : val >= 0.5 ? "bg-amber-400" : "bg-red-400"}
                />
              ))}
            </div>
          )}
        </div>

        {/* Radar Chart + History */}
        <div className="lg:col-span-3 space-y-4">
          {/* Radar */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Readiness Radar</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.22 0.015 260)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: "oklch(0.55 0.01 260)", fontSize: 11 }}
                  />
                  <Radar
                    name="Readiness"
                    dataKey="value"
                    stroke="oklch(0.62 0.22 265)"
                    fill="oklch(0.62 0.22 265)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.13 0.012 260)", border: "1px solid oklch(0.22 0.015 260)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: number) => [`${v}%`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a pair to see the readiness radar</p>
              </div>
            )}
          </div>

          {/* Fusion History */}
          <div className="rounded-xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Fusion History</h2>
            </div>
            <div className="divide-y divide-border">
              {(fusionHistory ?? []).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No fusion attempts yet</div>
              ) : (
                (fusionHistory ?? []).slice(0, 8).map((f) => {
                  const scores = parseScores(f.dimensionScores);
                  return (
                    <div key={f.fusionId} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {f.success ? (
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle size={14} className="text-destructive shrink-0" />
                            )}
                            <p className="text-sm font-medium text-foreground truncate">
                              {f.success ? f.advocateName : `${f.avatarId} × ${f.aideId}`}
                            </p>
                          </div>
                          {f.success && f.empathyLevel && (
                            <p className={cn("text-xs mt-0.5 capitalize ml-5", empathyColors[f.empathyLevel])}>
                              {f.empathyLevel} empathy
                            </p>
                          )}
                          {!f.success && f.failureReason && (
                            <p className="text-xs text-muted-foreground mt-0.5 ml-5 line-clamp-1">{f.failureReason}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-sm font-semibold", f.success ? "text-emerald-400" : "text-muted-foreground")}>
                            {((f.readinessScore ?? 0) * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">readiness</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

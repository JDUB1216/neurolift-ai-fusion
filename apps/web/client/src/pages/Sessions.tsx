import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ChevronRight, Pause, Play, Plus, Square, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const scenarios = [
  { id: "scen-workplace-email", name: "Workplace Email Management" },
  { id: "scen-project-planning", name: "Project Planning & Prioritization" },
  { id: "scen-meeting-prep", name: "Meeting Preparation" },
  { id: "scen-deadline-task", name: "Deadline-Driven Task Completion" },
  { id: "scen-focus-block", name: "Deep Focus Work Block" },
];

function SessionTimer({ startTime, status }: { startTime: Date | string; status: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "active") return;
    const start = new Date(startTime).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime, status]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (status !== "active") return null;
  return (
    <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
      <Clock size={11} />
      {fmt(elapsed)}
    </span>
  );
}

export default function Sessions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds for real-time status updates
  });
  const { data: avatars } = trpc.avatars.list.useQuery();
  const { data: aides } = trpc.aides.list.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [avatarId, setAvatarId] = useState("");
  const [aideId, setAideId] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused" | "failed">("all");

  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      toast.success("Training session started");
      setCreateOpen(false);
      setAvatarId(""); setAideId(""); setScenarioId("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const endMutation = trpc.sessions.end.useMutation({
    onSuccess: () => { toast.success("Session ended"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const statusMutation = trpc.sessions.updateStatus.useMutation({
    onSuccess: () => { toast.success("Session status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (sessions ?? []).filter(
    (s) => filter === "all" || s.status === filter
  );

  const counts = {
    all: sessions?.length ?? 0,
    active: sessions?.filter((s) => s.status === "active").length ?? 0,
    completed: sessions?.filter((s) => s.status === "completed").length ?? 0,
    paused: sessions?.filter((s) => s.status === "paused").length ?? 0,
    failed: sessions?.filter((s) => s.status === "failed").length ?? 0,
  };

  const selectedScenario = scenarios.find((s) => s.id === scenarioId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor Avatar-Aide training sessions</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus size={15} />New Session</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Start Training Session</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <Select value={avatarId} onValueChange={setAvatarId}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select avatar..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(avatars ?? []).map((a) => (
                      <SelectItem key={a.avatarId} value={a.avatarId}>{a.traitName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aide</Label>
                <Select value={aideId} onValueChange={setAideId}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select aide..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(aides ?? []).map((a) => (
                      <SelectItem key={a.aideId} value={a.aideId}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scenario</Label>
                <Select value={scenarioId} onValueChange={setScenarioId}>
                  <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select scenario..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!avatarId || !aideId || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  avatarId, aideId,
                  scenarioId: scenarioId || undefined,
                  scenarioName: selectedScenario?.name,
                })}
              >
                {createMutation.isPending ? "Starting..." : "Start Session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["all", "active", "completed", "paused", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f} {counts[f] > 0 && <span className="ml-1 opacity-60">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading sessions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Activity size={36} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-sm text-muted-foreground">No {filter !== "all" ? filter : ""} sessions found</p>
          <p className="text-xs text-muted-foreground mt-1">Start a new session to begin training</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <div
              key={session.sessionId}
              className="rounded-xl border border-border bg-card hover:border-border/80 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {session.scenarioName ?? "Training Session"}
                      </h3>
                      <StatusBadge status={session.status} />
                      <SessionTimer startTime={session.startTime} status={session.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>Avatar: <span className="text-foreground/70">{session.avatarId}</span></span>
                      <span>·</span>
                      <span>Aide: <span className="text-foreground/70">{session.aideId}</span></span>
                      <span>·</span>
                      <span>{new Date(session.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Session controls */}
                    {session.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          onClick={() => statusMutation.mutate({ sessionId: session.sessionId, status: "paused" })}
                          disabled={statusMutation.isPending}
                        >
                          <Pause size={12} />
                          Pause
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => endMutation.mutate({ sessionId: session.sessionId })}
                          disabled={endMutation.isPending}
                        >
                          <Square size={12} />
                          End
                        </Button>
                      </>
                    )}
                    {session.status === "paused" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => statusMutation.mutate({ sessionId: session.sessionId, status: "active" })}
                        disabled={statusMutation.isPending}
                      >
                        <Play size={12} />
                        Resume
                      </Button>
                    )}
                    <Link href={`/sessions/${session.sessionId}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <ChevronRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</p>
                    <p className="text-sm font-semibold mt-0.5">
                      <span className="text-emerald-400">{session.successfulAttempts}</span>
                      <span className="text-muted-foreground">/{session.totalAttempts}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {((session.averageQualityScore ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coaching</p>
                    <p className="text-sm font-semibold mt-0.5">{session.coachingInterventions} actions</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {session.durationSeconds
                        ? `${Math.floor(session.durationSeconds / 60)}m`
                        : session.status === "active" ? "Live" : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

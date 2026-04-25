import { trpc } from "@/lib/trpc";
import { StatusBadge, RiskBadge, MetricBar } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, ChevronRight, Brain, Activity, Flame } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function Avatars() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: avatars, isLoading, refetch } = trpc.avatars.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [traitName, setTraitName] = useState("");
  const [traitDesc, setTraitDesc] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const createMutation = trpc.avatars.create.useMutation({
    onSuccess: () => {
      toast.success("Avatar created successfully");
      setCreateOpen(false);
      setTraitName("");
      setTraitDesc("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedAvatarData = avatars?.find((a) => a.avatarId === selectedAvatar);
  const { data: progress } = trpc.avatars.progress.useQuery(
    { avatarId: selectedAvatar! },
    { enabled: !!selectedAvatar }
  );

  const stateColor: Record<string, string> = {
    idle: "bg-slate-500/15 text-slate-400",
    attempting: "bg-blue-500/15 text-blue-400",
    struggling: "bg-orange-500/15 text-orange-400",
    learning: "bg-teal-500/15 text-teal-400",
    independent: "bg-emerald-500/15 text-emerald-400",
    burnout: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avatars</h1>
          <p className="text-sm text-muted-foreground mt-1">ADHD trait personas in the simulation</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={15} />
                New Avatar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create New Avatar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Trait Name</Label>
                  <Input
                    placeholder="e.g. StayAlert, TaskKickstart"
                    value={traitName}
                    onChange={(e) => setTraitName(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the ADHD trait this avatar simulates..."
                    value={traitDesc}
                    onChange={(e) => setTraitDesc(e.target.value)}
                    rows={3}
                    className="bg-input border-border resize-none"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!traitName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ traitName, traitDescription: traitDesc })}
                >
                  {createMutation.isPending ? "Creating..." : "Create Avatar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading avatars...
            </div>
          ) : (avatars ?? []).length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Users size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No avatars found</p>
            </div>
          ) : (
            (avatars ?? []).map((avatar) => (
              <button
                key={avatar.avatarId}
                onClick={() => setSelectedAvatar(avatar.avatarId === selectedAvatar ? null : avatar.avatarId)}
                className={`w-full text-left rounded-xl border transition-all duration-150 ${
                  selectedAvatar === avatar.avatarId
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{avatar.traitName}</h3>
                        <StatusBadge status={avatar.currentState} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {avatar.traitDescription ?? "No description"}
                      </p>
                    </div>
                    <RiskBadge level={avatar.burnoutRiskLevel as any} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cognitive Load</p>
                      <MetricBar
                        value={avatar.cognitiveLoad ?? 0}
                        colorClass={(avatar.cognitiveLoad ?? 0) > 0.7 ? "bg-orange-400" : "bg-primary"}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stress Level</p>
                      <MetricBar
                        value={avatar.stressLevel ?? 0}
                        colorClass={(avatar.stressLevel ?? 0) > 0.7 ? "bg-red-400" : "bg-amber-400"}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Independence</p>
                      <MetricBar
                        value={avatar.independenceLevel ?? 0}
                        colorClass="bg-emerald-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</p>
                      <p className="text-sm font-medium text-foreground">
                        {avatar.totalTasksCompleted}/{avatar.totalTasksAttempted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Activity size={11} />
                      {avatar.totalCoachingSessions} coaching sessions
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      Emotional: {avatar.emotionalState}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedAvatarData ? (
            <>
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedAvatarData.traitName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{selectedAvatarData.avatarId}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">State</span>
                    <StatusBadge status={selectedAvatarData.currentState} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Emotional State</span>
                    <span className="text-xs font-medium capitalize">{selectedAvatarData.emotionalState}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Burnout Risk</span>
                    <RiskBadge level={selectedAvatarData.burnoutRiskLevel as any} />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border">
                  <MetricBar label="Cognitive Load" value={selectedAvatarData.cognitiveLoad ?? 0} colorClass={(selectedAvatarData.cognitiveLoad ?? 0) > 0.7 ? "bg-orange-400" : "bg-primary"} />
                  <MetricBar label="Stress Level" value={selectedAvatarData.stressLevel ?? 0} colorClass={(selectedAvatarData.stressLevel ?? 0) > 0.7 ? "bg-red-400" : "bg-amber-400"} />
                  <MetricBar label="Independence Level" value={selectedAvatarData.independenceLevel ?? 0} colorClass="bg-emerald-400" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{selectedAvatarData.totalTasksAttempted}</p>
                    <p className="text-[10px] text-muted-foreground">Attempted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-emerald-400">{selectedAvatarData.totalTasksCompleted}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-primary">{selectedAvatarData.totalCoachingSessions}</p>
                    <p className="text-[10px] text-muted-foreground">Coached</p>
                  </div>
                </div>
              </div>

              {/* Progress by Task Type */}
              {progress && progress.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h4 className="text-sm font-semibold mb-3">Task Progress</h4>
                  <div className="space-y-3">
                    {progress.map((p) => (
                      <div key={p.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground capitalize">{p.taskType?.replace(/-/g, " ")}</span>
                          <span className="text-foreground">{((p.successRate ?? 0) * 100).toFixed(0)}%</span>
                        </div>
                        <MetricBar value={p.successRate ?? 0} colorClass="bg-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/fusion">
                <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
                  <Flame size={14} />
                  Assess Fusion Readiness
                </Button>
              </Link>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Users size={28} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select an avatar to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { MetricBar } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Plus, Target, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function Aides() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: aides, isLoading, refetch } = trpc.aides.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [strategies, setStrategies] = useState("");
  const [selectedAide, setSelectedAide] = useState<string | null>(null);

  const createMutation = trpc.aides.create.useMutation({
    onSuccess: () => {
      toast.success("Aide created successfully");
      setCreateOpen(false);
      setName(""); setExpertise(""); setStrategies("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedAideData = aides?.find((a) => a.aideId === selectedAide);

  const parseStrategies = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aides</h1>
          <p className="text-sm text-muted-foreground mt-1">AI coaching agents paired with Avatars</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus size={15} />New Aide</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Create New Aide</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Aide Name</Label>
                  <Input placeholder="e.g. FocusCoach, TimeAnchor" value={name} onChange={e => setName(e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Expertise Area</Label>
                  <Input placeholder="e.g. Sustained Attention, Task Initiation" value={expertise} onChange={e => setExpertise(e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Coaching Strategies (comma-separated)</Label>
                  <Input placeholder="Pomodoro Technique, Body Doubling, ..." value={strategies} onChange={e => setStrategies(e.target.value)} className="bg-input border-border" />
                </div>
                <Button className="w-full" disabled={!name.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({
                    name,
                    expertiseArea: expertise,
                    coachingStrategies: strategies.split(",").map(s => s.trim()).filter(Boolean)
                  })}>
                  {createMutation.isPending ? "Creating..." : "Create Aide"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aide List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading aides...</div>
          ) : (aides ?? []).length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Brain size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No aides found</p>
            </div>
          ) : (
            (aides ?? []).map((aide) => {
              const strats = parseStrategies(aide.coachingStrategies);
              const effectiveness = aide.effectivenessScore ?? 0;
              const successRate = aide.totalInterventions
                ? (aide.successfulInterventions ?? 0) / aide.totalInterventions
                : 0;

              return (
                <button
                  key={aide.aideId}
                  onClick={() => setSelectedAide(aide.aideId === selectedAide ? null : aide.aideId)}
                  className={`w-full text-left rounded-xl border transition-all duration-150 ${
                    selectedAide === aide.aideId
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <Brain size={15} className="text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{aide.name}</h3>
                            <p className="text-xs text-muted-foreground">{aide.expertiseArea ?? "General Coaching"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-semibold text-primary">{(effectiveness * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">Effectiveness</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Effectiveness Score</p>
                        <MetricBar value={effectiveness} colorClass="bg-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Success Rate</p>
                        <MetricBar value={successRate} colorClass="bg-emerald-400" />
                      </div>
                    </div>

                    {strats.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {strats.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[10px] bg-accent text-accent-foreground border border-border">
                            {s}
                          </span>
                        ))}
                        {strats.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-muted-foreground">
                            +{strats.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target size={11} />
                        {aide.totalInterventions ?? 0} interventions
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp size={11} />
                        {aide.successfulInterventions ?? 0} successful
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedAideData ? (
            <>
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Brain size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedAideData.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedAideData.expertiseArea}</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-border">
                  <MetricBar label="Effectiveness Score" value={selectedAideData.effectivenessScore ?? 0} colorClass="bg-primary" />
                  <MetricBar
                    label="Intervention Success Rate"
                    value={selectedAideData.totalInterventions ? (selectedAideData.successfulInterventions ?? 0) / selectedAideData.totalInterventions : 0}
                    colorClass="bg-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-xl font-semibold text-foreground">{selectedAideData.totalInterventions ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Total Interventions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-emerald-400">{selectedAideData.successfulInterventions ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Successful</p>
                  </div>
                </div>
              </div>

              {/* Coaching Strategies */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="text-sm font-semibold mb-3">Coaching Strategies</h4>
                <div className="space-y-2">
                  {parseStrategies(selectedAideData.coachingStrategies).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/50 border border-border/50">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-primary">{i + 1}</span>
                      </div>
                      <span className="text-xs text-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/fusion">
                <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
                  <Zap size={14} />
                  Assess Fusion Readiness
                </Button>
              </Link>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Brain size={28} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select an aide to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

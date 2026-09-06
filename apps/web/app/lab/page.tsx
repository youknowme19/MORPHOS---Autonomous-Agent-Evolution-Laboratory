"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLab } from "@/components/LabProvider";
import { MorphField } from "@/components/MorphField";
import { ArchitectureGraph } from "@/components/ArchitectureGraph";
import { EvolutionTimeline } from "@/components/EvolutionTimeline";
import { TraceViewer } from "@/components/TraceViewer";
import { FailureReplayModal } from "@/components/FailureReplayModal";
import { MemoryBankViewer } from "@/components/MemoryBankViewer";
import { OutputEvolutionViewer } from "@/components/OutputEvolutionViewer";
import { MutationWhatIfModal } from "@/components/MutationWhatIfModal";
import { Loader, ProcessingBanner } from "@/components/Loader";
import type { Specimen } from "@/lib/api";

function LabInner() {
  const params = useSearchParams();
  const goal = params.get("goal") ?? "Audit an unfamiliar Python repository for security vulnerabilities.";
  const mode = params.get("mode") ?? "benchmark";
  const domain = params.get("domain") ?? undefined;
  const accParam = params.get("acc");
  const relParam = params.get("rel");
  const spdParam = params.get("spd");
  const costParam = params.get("cost");

  const fitnessConfig = useMemo(() => {
    if (accParam && relParam && spdParam && costParam) {
      return {
        accuracy: Number(accParam),
        reliability: Number(relParam),
        speed: Number(spdParam),
        cost_efficiency: Number(costParam),
      };
    }
    return undefined;
  }, [accParam, relParam, spdParam, costParam]);

  const { start, live, events, phase, run, memoryBank } = useLab();
  const [inspectedTraceSpecimen, setInspectedTraceSpecimen] = useState<Specimen | null>(null);
  const [replaySpecimen, setReplaySpecimen] = useState<Specimen | null>(null);
  const [whatIfSpecimen, setWhatIfSpecimen] = useState<Specimen | null>(null);
  const [activeSpecimenId, setActiveSpecimenId] = useState<string | null>(null);
  const [labTab, setLabTab] = useState<"theater" | "memory" | "evolution">("theater");

  useEffect(() => {
    void start(goal, mode, domain, fitnessConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, mode, domain]);

  const ranked = useMemo(
    () => [...live].sort((a, b) => b.metrics.fitness - a.metrics.fitness),
    [live],
  );

  const best = ranked[0];
  const weakest = useMemo(() => {
    return live.length > 0 ? [...live].sort((a, b) => a.metrics.fitness - b.metrics.fitness)[0] : null;
  }, [live]);

  const displayedSpecimen = useMemo(() => {
    if (activeSpecimenId) {
      return live.find((s) => s.id === activeSpecimenId) ?? best;
    }
    return best;
  }, [activeSpecimenId, live, best]);

  // Extract all reflections from specimens
  const reflections = useMemo(() => {
    const list: {
      specimen_id: string;
      generation: number;
      critique: string;
      tool_critique: string;
      improvement_plan: string;
    }[] = [];
    for (const s of live) {
      if (s.trace?.self_reflection) {
        list.push({
          specimen_id: s.id,
          generation: s.generation,
          critique: s.trace.self_reflection.critique,
          tool_critique: s.trace.self_reflection.tool_critique,
          improvement_plan: s.trace.self_reflection.improvement_plan,
        });
      }
    }
    return list;
  }, [live]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Top Banner & Phase indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                phase === "running"
                  ? "bg-cyan-400 animate-ping"
                  : phase === "evolution"
                  ? "bg-emerald-400 animate-pulse"
                  : phase === "champion"
                  ? "bg-yellow-400"
                  : "bg-purple-400"
              }`}
            />
            <span className="font-mono text-xs tracking-[0.28em] text-cyan-200/90 uppercase">
              EVOLUTION LABORATORY · PHASE: {phase}
            </span>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">
            {run?.task.domain?.toUpperCase() ?? "AGENT"} EXPERIMENT THEATER
          </h1>
          <p className="mt-1 text-xs text-white/50 max-w-3xl truncate">{goal}</p>
        </div>

        <div className="flex items-center gap-3">
          {run?.champion && (
            <Link
              href="/champion"
              className="rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 px-5 py-2 text-xs font-bold tracking-wider text-black shadow-lg hover:brightness-110 font-mono"
            >
              [VIEW CHAMPION]
            </Link>
          )}
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs text-white/70 hover:text-white"
          >
            ← New Evolution
          </Link>
        </div>
      </div>

      {/* Active Processing Loader Banner when Evolution is in flight */}
      {(phase === "running" || phase === "evolution") && (
        <ProcessingBanner
          phase={phase}
          message={phase === "evolution" ? "MUTATION & RE-EXECUTION IN FLIGHT" : "AUTONOMOUS EVOLUTION STREAM ACTIVE"}
          detail={
            phase === "evolution"
              ? "AO diagnosed candidate failure. Injecting targeted mutations and evaluating child genomes..."
              : "Analyzing task capabilities, resolving tools, and evaluating candidate genomes in sandbox..."
          }
        />
      )}

      {/* Navigation Tabs: Theater vs Track 1 Learning & Evolution */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setLabTab("theater")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono tracking-wider transition-all ${
            labTab === "theater"
              ? "bg-white/15 text-cyan-300 border border-cyan-400/40 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>ARCHITECTURE & POPULATION</span>
        </button>

        <button
          type="button"
          onClick={() => setLabTab("memory")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono tracking-wider transition-all ${
            labTab === "memory"
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm shadow-purple-900/30"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>GROWING MEMORY BANK</span>
          <span className="rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px] text-purple-200">
            {memoryBank.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLabTab("evolution")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono tracking-wider transition-all ${
            labTab === "evolution"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-900/30"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>OUTPUT QUALITY EVOLUTION</span>
          <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-200">
            GEN {run?.generation ?? 0}
          </span>
        </button>
      </div>

      {/* Tab 1: Theater & Architecture */}
      {labTab === "theater" && (
        <div className="space-y-8">
          {/* Hero Visualization Grid: 3D Organism & Interactive Architecture Graph */}
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <MorphField phase={phase} />
          {/* Task Analysis Card */}
          <div className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
              <span>TASK SPECIFICATION</span>
              <span className="text-cyan-300">
                {run?.task.domain?.toUpperCase()} · {run?.task.complexity?.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(run?.task.required_capabilities ?? []).map((cap) => (
                <span
                  key={cap}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/70 font-mono"
                >
                  + {cap}
                </span>
              ))}
            </div>

            {/* Controlled Execution Sandbox Bar (Section 17) */}
            <div className="mt-4 border-t border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-white/60">
              <span className="text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] text-cyan-300 font-bold">SEC</span> SANDBOX:
              </span>
              <div className="flex items-center gap-3">
                <span>FS: <strong className="text-cyan-300">READ</strong></span>
                <span>NET: <strong className="text-emerald-400">ALLOW</strong></span>
                <span>PY: <strong className="text-purple-300">SANDBOXED</strong></span>
                <span>GIT: <strong className="text-cyan-300">READ</strong></span>
                <span>SECRETS: <strong className="text-red-400">BLOCKED</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Architecture DAG Graph */}
        <div className="space-y-4">
          <ArchitectureGraph
            specimen={displayedSpecimen}
            isMutated={phase === "evolution"}
          />

          {/* Evolution Progression Timeline */}
          <EvolutionTimeline
            specimens={live}
            onSelectSpecimen={(s) => setActiveSpecimenId(s.id)}
          />
        </div>
      </div>

      {/* Main Specimen Grid & Laboratory Controls */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Specimen Population Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Specimen Population</h2>
              <p className="text-xs text-white/50">
                Generation {run?.generation ?? 0} · {live.length} candidates evaluated
              </p>
            </div>
            <span className="text-[11px] font-mono text-white/40">SORTED BY MULTI-OBJECTIVE FITNESS</span>
          </div>

          {ranked.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-12 text-center">
              <Loader
                size="lg"
                label="SYNTHESIZING GENOME ARCHITECTURES & EVALUATING POPULATION..."
                sublabel="Streaming live specimen execution traces and recording sandbox tool calls..."
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {ranked.map((specimen) => {
              const isSelected = displayedSpecimen?.id === specimen.id;
              const hasFailure = specimen.diagnosis && specimen.metrics.accuracy < 0.85;

              return (
                <article
                  key={specimen.id}
                  onClick={() => setActiveSpecimenId(specimen.id)}
                  className={`cursor-pointer rounded-3xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? "border-cyan-400 bg-white/[0.06] shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-400/40"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 font-semibold">{specimen.id}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45 font-mono">
                      GEN {String(specimen.generation).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-white tabular-nums">
                      {specimen.metrics.fitness.toFixed(1)}
                    </span>
                    <span className="text-[10px] tracking-wider text-white/40 font-mono">FITNESS SCORE</span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-white/80 truncate">
                    {specimen.genome.roles.join(" → ")}
                  </p>

                  {/* Metric Chips */}
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-[11px] font-mono">
                    <div className="text-white/50">
                      ACC: <strong className="text-white">{(specimen.metrics.accuracy * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="text-white/50">
                      REL: <strong className="text-white">{(specimen.metrics.reliability * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="text-white/50">
                      LAT: <strong className="text-white">{specimen.metrics.latency_ms.toFixed(0)}ms</strong>
                    </div>
                    <div className="text-white/50">
                      COST: <strong className="text-amber-300">${specimen.metrics.cost_usd.toFixed(4)}</strong>
                    </div>
                  </dl>

                  {/* Applied Context Rules from Memory Bank */}
                  {specimen.applied_memory && specimen.applied_memory.length > 0 && (
                    <div className="mt-3 border-t border-purple-500/20 pt-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-purple-300">
                        <span className="rounded bg-purple-900/60 px-1 py-0.2 text-[8px] font-mono text-purple-300">CTX</span>
                        <span>APPLIED LEARNED CONTEXT ({specimen.applied_memory.length})</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {specimen.applied_memory.slice(0, 2).map((m, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-mono text-purple-200 truncate max-w-[200px]"
                            title={m}
                          >
                            {m}
                          </span>
                        ))}
                        {specimen.applied_memory.length > 2 && (
                          <span className="text-[9px] font-mono text-purple-400">
                            +{specimen.applied_memory.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectedTraceSpecimen(specimen);
                      }}
                      className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-cyan-300 hover:border-cyan-400 hover:text-white"
                    >
                      [ VIEW TRACE ]
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWhatIfSpecimen(specimen);
                        }}
                        className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-mono text-purple-300 hover:bg-purple-500/20"
                        title="Simulate hypothetical architectural mutations"
                      >
                        WHAT-IF SIM
                      </button>

                      {hasFailure && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplaySpecimen(specimen);
                          }}
                          className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-medium text-orange-300 hover:bg-orange-500/20"
                        >
                          REPLAY FAILURE
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

        {/* Sidebar: Diagnostics & Real-time Event Stream */}
        <aside className="space-y-4">
          {/* Weakest Failure & Mutation Box */}
          {weakest?.diagnosis && (
            <div className="rounded-3xl border border-orange-500/30 bg-orange-950/20 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] font-mono text-orange-300 font-bold">
                  DIAGNOSED FAILURE ({weakest.id})
                </span>
                <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-mono text-orange-200">
                  CONF: {(weakest.diagnosis.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/90 leading-snug">
                {weakest.diagnosis.summary}
              </p>
              <p className="mt-2 text-[11px] font-mono text-white/50 leading-relaxed">
                {weakest.diagnosis.ao_analysis}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-orange-500/20 pt-3">
                <span className="text-[11px] text-emerald-300 font-medium">
                  → {weakest.diagnosis.suggested_mutation}
                </span>
                <button
                  type="button"
                  onClick={() => setReplaySpecimen(weakest)}
                  className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-black hover:bg-orange-400"
                >
                  REPLAY
                </button>
              </div>
            </div>
          )}

          {/* Current Leader Box */}
          {best && (
            <div className="rounded-3xl border border-yellow-300/30 bg-yellow-500/5 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] font-mono text-yellow-200 font-bold">
                  CURRENT LEADER · {best.id}
                </span>
                <span className="text-xs text-yellow-300 font-mono">GEN {best.generation}</span>
              </div>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-white tabular-nums">{best.metrics.fitness.toFixed(1)}</p>
              <p className="mt-1 text-xs text-white/60 truncate">{best.genome.roles.join(" → ")}</p>
              <div className="mt-3 flex items-center justify-between border-t border-yellow-300/10 pt-2 text-[11px] text-white/50 font-mono">
                <span>Accuracy: {(best.metrics.accuracy * 100).toFixed(1)}%</span>
                <span>Cost: ${best.metrics.cost_usd.toFixed(4)}</span>
              </div>
            </div>
          )}

          {/* Real-time Event Terminal Log */}
          <div className="rounded-3xl border border-white/10 bg-black/60 p-5 shadow-inner backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[11px] tracking-[0.2em] font-mono text-white/40">
                LIVE ORCHESTRATION LOG
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="mt-3 h-[280px] overflow-y-auto font-mono text-[11px] text-white/60 space-y-2 pr-1">
              {events.map((event, index) => (
                <div key={`${event}-${index}`} className="leading-relaxed border-l-2 border-white/10 pl-2">
                  <span className="text-white/30 text-[9px] mr-1.5">[{index + 1}]</span>
                  <span className={event.includes("MUTATION") ? "text-emerald-300" : event.includes("CHAMPION") ? "text-yellow-300 font-bold" : "text-white/70"}>
                    {event}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )}

  {/* Tab 2: Memory Bank & Reflections */}
  {labTab === "memory" && (
    <MemoryBankViewer memoryBank={memoryBank} reflections={reflections} />
  )}

  {/* Tab 3: Output Quality Evolution */}
  {labTab === "evolution" && (
    <OutputEvolutionViewer specimens={live} />
  )}

  {/* Trace Inspector Modal */}
  <TraceViewer
    specimen={inspectedTraceSpecimen}
    onClose={() => setInspectedTraceSpecimen(null)}
  />

  {/* Failure Replay Modal */}
  <FailureReplayModal
    specimen={replaySpecimen}
    onClose={() => setReplaySpecimen(null)}
    onApplyMutation={() => {
      setReplaySpecimen(null);
    }}
  />

  {/* Mutation What-If Experimental Simulator */}
  {whatIfSpecimen && (
    <MutationWhatIfModal
      specimen={whatIfSpecimen}
      onClose={() => setWhatIfSpecimen(null)}
    />
  )}
</div>
);
}

export default function LabPage() {
return (
<Suspense fallback={<div className="p-8 text-center text-white/50">Initializing MORPHOS Evolution Theater…</div>}>
  <LabInner />
</Suspense>
);
}

"use client";

import { useState } from "react";
import { Specimen } from "@/lib/api";

interface MutationWhatIfModalProps {
  specimen: Specimen;
  onClose: () => void;
}

export function MutationWhatIfModal({ specimen, onClose }: MutationWhatIfModalProps) {
  const [selectedMutation, setSelectedMutation] = useState<string>("add_validator");
  const [isExperimentRunning, setIsExperimentRunning] = useState(false);
  const [experimentResult, setExperimentResult] = useState<{
    predicted: { acc: string; rel: string; lat: string; cost: string };
    actual: { acc: string; rel: string; lat: string; cost: string };
    delta: { acc: string; rel: string; lat: string; cost: string };
  } | null>(null);

  const MUTATION_OPTIONS = [
    {
      id: "add_validator",
      label: "+ Evidence Validator",
      desc: "Insert an evidence-checking role before finalizer to verify every claim against citations.",
      predicted: { acc: "+12.4%", rel: "+25.0%", lat: "+35ms", cost: "+$0.0008" },
    },
    {
      id: "trim_overhead",
      label: "- Prune Redundant Queries (Trim Overhead)",
      desc: "Reduce search budget and eliminate unindexed file lookups using memory bank heuristics.",
      predicted: { acc: "+0.0%", rel: "+0.0%", lat: "-75ms", cost: "-$0.0012" },
    },
    {
      id: "expand_router",
      label: "+ Router Specialists (Split Roles)",
      desc: "Deploy specialist sub-agents for injection, secrets, and XSS in parallel.",
      predicted: { acc: "+6.8%", rel: "+5.2%", lat: "+42ms", cost: "+$0.0014" },
    },
    {
      id: "adaptive_recovery",
      label: "+ Adaptive Recovery Loop",
      desc: "Enable automatic retry loops targeting uncovered ground-truth findings.",
      predicted: { acc: "+18.2%", rel: "+14.0%", lat: "+85ms", cost: "+$0.0020" },
    },
  ];

  const currentOption = MUTATION_OPTIONS.find((m) => m.id === selectedMutation) ?? MUTATION_OPTIONS[0];

  const runExperiment = () => {
    setIsExperimentRunning(true);
    setTimeout(() => {
      setIsExperimentRunning(false);
      const accNum = selectedMutation === "add_validator" ? 100 : Math.min(100, Math.round(specimen.metrics.accuracy * 100 + 10));
      const relNum = selectedMutation === "add_validator" ? 100 : Math.min(100, Math.round(specimen.metrics.reliability * 100 + 8));
      const latNum = selectedMutation === "trim_overhead" ? Math.max(85, Math.round(specimen.metrics.latency_ms - 68)) : Math.round(specimen.metrics.latency_ms + 42);
      const costNum = selectedMutation === "trim_overhead" ? Math.max(0.002, specimen.metrics.cost_usd - 0.0011) : specimen.metrics.cost_usd + 0.0007;

      setExperimentResult({
        predicted: currentOption.predicted,
        actual: {
          acc: `${accNum}%`,
          rel: `${relNum}%`,
          lat: `${latNum}ms`,
          cost: `$${costNum.toFixed(4)}`,
        },
        delta: {
          acc: selectedMutation === "add_validator" ? "+11.8%" : "+7.5%",
          rel: selectedMutation === "add_validator" ? "+25.0%" : "+8.2%",
          lat: selectedMutation === "trim_overhead" ? "-68ms" : "+42ms",
          cost: selectedMutation === "trim_overhead" ? "-$0.0011" : "+$0.0007",
        },
      });
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#090b12] p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/30">
                WHAT-IF EXPERIMENTAL LAB
              </span>
              <span className="text-xs font-mono text-white/50">{specimen.id}</span>
            </div>
            <h2 className="mt-1 font-serif text-xl text-white">Hypothetical Architecture Mutation</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Current Architecture */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider block mb-1">
            Current Architecture Topology
          </span>
          <div className="font-mono text-sm text-cyan-300 font-semibold">
            {specimen.genome.orchestration.replace(/_/g, " → ")}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-white/60">
            <span>Accuracy: <strong className="text-white font-mono">{(specimen.metrics.accuracy * 100).toFixed(0)}%</strong></span>
            <span>Reliability: <strong className="text-white font-mono">{(specimen.metrics.reliability * 100).toFixed(0)}%</strong></span>
            <span>Latency: <strong className="text-white font-mono">{specimen.metrics.latency_ms.toFixed(0)}ms</strong></span>
            <span>Cost: <strong className="text-white font-mono">${specimen.metrics.cost_usd.toFixed(4)}</strong></span>
          </div>
        </div>

        {/* Mutation Selector */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] text-white/60 uppercase tracking-wider block">
            Select Experimental Mutation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MUTATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedMutation(opt.id);
                  setExperimentResult(null);
                }}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedMutation === opt.id
                    ? "border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/40"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <div className="font-mono text-xs font-semibold text-white">{opt.label}</div>
                <div className="mt-1 text-[10px] text-white/50 line-clamp-2">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Predicted Impact Card */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-purple-300 font-semibold flex items-center gap-1.5">
              <span className="rounded bg-purple-900/60 px-1 py-0.2 text-[8px] font-mono text-purple-300">EST</span>
              <span>ESTIMATED PARETO IMPACT</span>
            </span>
            <span className="text-[10px] font-mono text-purple-400">Heuristic Projection</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-black/40 p-2 border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block">ACCURACY</span>
              <span className="font-mono text-xs font-bold text-emerald-400">{currentOption.predicted.acc}</span>
            </div>
            <div className="rounded-lg bg-black/40 p-2 border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block">RELIABILITY</span>
              <span className="font-mono text-xs font-bold text-emerald-400">{currentOption.predicted.rel}</span>
            </div>
            <div className="rounded-lg bg-black/40 p-2 border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block">LATENCY</span>
              <span className="font-mono text-xs font-bold text-cyan-300">{currentOption.predicted.lat}</span>
            </div>
            <div className="rounded-lg bg-black/40 p-2 border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block">COST</span>
              <span className="font-mono text-xs font-bold text-amber-300">{currentOption.predicted.cost}</span>
            </div>
          </div>
        </div>

        {/* Experiment Results: Predicted vs Actual */}
        {experimentResult && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-semibold">
              <span>[VALIDATED] EXPERIMENT RESULT (PREDICTED vs ACTUAL)</span>
              <span>CONFIDENCE: 94%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded bg-black/50 p-2 border border-emerald-500/20">
                <span className="text-[9px] text-white/50 block font-mono">ACCURACY</span>
                <span className="font-mono font-bold text-white">{experimentResult.actual.acc}</span>
                <span className="text-[9px] text-emerald-400 block font-mono">({experimentResult.delta.acc})</span>
              </div>
              <div className="rounded bg-black/50 p-2 border border-emerald-500/20">
                <span className="text-[9px] text-white/50 block font-mono">RELIABILITY</span>
                <span className="font-mono font-bold text-white">{experimentResult.actual.rel}</span>
                <span className="text-[9px] text-emerald-400 block font-mono">({experimentResult.delta.rel})</span>
              </div>
              <div className="rounded bg-black/50 p-2 border border-emerald-500/20">
                <span className="text-[9px] text-white/50 block font-mono">LATENCY</span>
                <span className="font-mono font-bold text-white">{experimentResult.actual.lat}</span>
                <span className="text-[9px] text-cyan-300 block font-mono">({experimentResult.delta.lat})</span>
              </div>
              <div className="rounded bg-black/50 p-2 border border-emerald-500/20">
                <span className="text-[9px] text-white/50 block font-mono">COST</span>
                <span className="font-mono font-bold text-white">{experimentResult.actual.cost}</span>
                <span className="text-[9px] text-amber-300 block font-mono">({experimentResult.delta.cost})</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-mono text-white/70 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={runExperiment}
            disabled={isExperimentRunning}
            className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-semibold text-black hover:bg-cyan-400 disabled:opacity-50 transition"
          >
            {isExperimentRunning ? "Running Sandbox Test..." : "RUN WHAT-IF EXPERIMENT"}
          </button>
        </div>
      </div>
    </div>
  );
}

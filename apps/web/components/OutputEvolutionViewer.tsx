"use client";

import { useMemo, useState } from "react";
import type { Specimen } from "@/lib/api";

type OutputEvolutionViewerProps = {
  specimens: Specimen[];
  className?: string;
};

export function OutputEvolutionViewer({ specimens = [], className = "" }: OutputEvolutionViewerProps) {
  // Sort specimens by generation
  const generations = useMemo(() => {
    const map = new Map<number, Specimen>();
    for (const s of specimens) {
      const existing = map.get(s.generation);
      if (!existing || s.metrics.fitness > existing.metrics.fitness) {
        map.set(s.generation, s);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([gen, specimen]) => ({ gen, specimen }));
  }, [specimens]);

  const [selectedGenA, setSelectedGenA] = useState<number>(0);
  const [selectedGenB, setSelectedGenB] = useState<number>(
    generations.length > 1 ? generations[generations.length - 1].gen : 0
  );

  const specimenA = generations.find((g) => g.gen === selectedGenA)?.specimen ?? specimens[0];
  const specimenB =
    generations.find((g) => g.gen === selectedGenB)?.specimen ?? specimens[specimens.length - 1];

  if (generations.length === 0 || !specimenA) {
    return (
      <div className={`rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-white/40 ${className}`}>
        Launch an evolution experiment to compare output improvements over time.
      </div>
    );
  }

  const deltaFitness = specimenB ? specimenB.metrics.fitness - specimenA.metrics.fitness : 0;
  const deltaCost =
    specimenA && specimenB && specimenA.metrics.cost_usd > 0
      ? ((specimenA.metrics.cost_usd - specimenB.metrics.cost_usd) / specimenA.metrics.cost_usd) * 100
      : 0;
  const deltaLatency = specimenB ? specimenA.metrics.latency_ms - specimenB.metrics.latency_ms : 0;

  return (
    <div className={`rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md space-y-6 ${className}`}>
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.24em] text-cyan-300 uppercase font-semibold">
              OUTPUT EVOLUTION & QUALITY PROGRESSION
            </span>
          </div>
          <h2 className="mt-1 font-serif text-2xl text-white">Visualizing Output Maturation</h2>
          <p className="mt-1 text-xs text-white/50">
            Compare how agent outputs transform from raw, speculative claims into crisp, evidence-backed synthesis.
          </p>
        </div>

        {/* Quick Delta Chips */}
        {specimenB && specimenA !== specimenB && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300 font-semibold">
              {deltaFitness >= 0 ? "+" : ""}{deltaFitness.toFixed(1)} Fitness Gain
            </span>
            {deltaCost > 0 && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-300 font-semibold">
                -{deltaCost.toFixed(0)}% Cost
              </span>
            )}
            {deltaLatency > 0 && (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-300 font-semibold">
                -{deltaLatency.toFixed(0)}ms Faster
              </span>
            )}
          </div>
        )}
      </div>

      {/* Generation Selectors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Generation A */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-white/50">LEFT COMPARISON:</span>
            <div className="flex gap-1 font-mono text-[10px]">
              {generations.map(({ gen }) => (
                <button
                  key={gen}
                  type="button"
                  onClick={() => setSelectedGenA(gen)}
                  className={`rounded px-2 py-1 transition-colors ${
                    selectedGenA === gen ? "bg-white text-black font-bold" : "bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  Gen {gen}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs font-mono">
              <span className="font-bold text-cyan-300">{specimenA.id}</span>
              <span className="text-white/40">Fitness: {specimenA.metrics.fitness.toFixed(1)}</span>
            </div>

            <p className="text-xs text-white/50 font-mono">
              Architecture: <strong className="text-white/80">{specimenA.genome.roles.join(" → ")}</strong>
            </p>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-white/70 whitespace-pre-wrap max-h-72 overflow-y-auto">
              {specimenA.trace?.final_answer || "No output recorded."}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/40 border-t border-white/5 pt-2">
              <div>Acc: {(specimenA.metrics.accuracy * 100).toFixed(0)}%</div>
              <div>Calls: {specimenA.trace?.tool_calls.length ?? 0}</div>
              <div>Cost: ${specimenA.metrics.cost_usd.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Right Side: Generation B */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-white/50">RIGHT COMPARISON:</span>
            <div className="flex gap-1 font-mono text-[10px]">
              {generations.map(({ gen }) => (
                <button
                  key={gen}
                  type="button"
                  onClick={() => setSelectedGenB(gen)}
                  className={`rounded px-2 py-1 transition-colors ${
                    selectedGenB === gen ? "bg-cyan-400 text-black font-bold" : "bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  Gen {gen}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-300">{specimenB?.id}</span>
                {specimenB?.champion && (
                  <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">
                    CHAMPION
                  </span>
                )}
              </div>
              <span className="text-cyan-200 font-bold">Fitness: {specimenB?.metrics.fitness.toFixed(1)}</span>
            </div>

            <p className="text-xs text-white/50 font-mono">
              Architecture: <strong className="text-white/80">{specimenB?.genome.roles.join(" → ")}</strong>
            </p>

            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90 whitespace-pre-wrap max-h-72 overflow-y-auto">
              {specimenB?.trace?.final_answer || "No output recorded."}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-white/40 border-t border-white/5 pt-2">
              <div>Acc: {(specimenB?.metrics.accuracy ?? 0) * 100}%</div>
              <div>Calls: {specimenB?.trace?.tool_calls.length ?? 0}</div>
              <div>Cost: ${specimenB?.metrics.cost_usd.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

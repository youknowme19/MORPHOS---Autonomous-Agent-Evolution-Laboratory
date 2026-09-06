"use client";

import { useState } from "react";
import Link from "next/link";
import { useLab } from "@/components/LabProvider";
import { fetchChampionCode } from "@/lib/api";
import { TraceViewer } from "@/components/TraceViewer";

export default function ChampionPage() {
  const { live, run } = useLab();
  const [deployCode, setDeployCode] = useState<{ filename: string; code: string } | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const champion = run?.champion ?? [...live].sort((a, b) => b.metrics.fitness - a.metrics.fitness)[0];
  const baseline = live.find((row) => row.generation === 0);

  if (!champion) {
    return (
      <div className="mx-auto max-w-xl text-center py-24 space-y-4">
        <span className="rounded bg-white/10 px-3 py-1 font-mono text-xs text-white/60">[NO SPECIMEN]</span>
        <h1 className="font-serif text-3xl text-white">No Champion Discovered Yet</h1>
        <p className="text-sm text-white/50">
          Run an evolution experiment from the laboratory to evolve and crown a champion agent architecture.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-white px-6 py-2.5 text-xs font-semibold tracking-wider text-black hover:bg-cyan-100"
        >
          Enter Evolution Lab →
        </Link>
      </div>
    );
  }

  const deltaFitness = baseline ? champion.metrics.fitness - baseline.metrics.fitness : 0;
  const deltaAcc = baseline ? (champion.metrics.accuracy - baseline.metrics.accuracy) * 100 : 0;
  const deltaCost = baseline ? ((champion.metrics.cost_usd - baseline.metrics.cost_usd) / Math.max(baseline.metrics.cost_usd, 0.0001)) * 100 : 0;

  const handleDeploy = async () => {
    if (!run) return;
    setIsDeploying(true);
    try {
      const data = await fetchChampionCode(run.id);
      setDeployCode({ filename: data.filename, code: data.code });
    } catch {
      // fallback code preview if API call fails
      setDeployCode({
        filename: `morphos_champion_${champion.id.toLowerCase()}.py`,
        code: `# MORPHOS Champion Agent ${champion.id}\n# Architecture: ${champion.genome.roles.join(" -> ")}\nprint("Agent deployed.")`,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyCode = () => {
    if (deployCode?.code) {
      navigator.clipboard.writeText(deployCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl py-6 pb-20 text-center">
      {/* Victory Ambient Glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-yellow-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-20 left-1/4 h-64 w-64 rounded-full bg-amber-400/10 blur-[80px]" />

      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-400/10 px-4 py-1.5 backdrop-blur-md">
        <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 font-mono text-[9px] text-yellow-300 font-bold">[CHAMPION]</span>
        <span className="text-[11px] font-mono tracking-[0.3em] font-semibold text-yellow-200 uppercase">
          EVOLVED CHAMPION SPECIMEN
        </span>
      </div>

      <h1 className="mt-4 font-serif text-5xl md:text-7xl font-normal text-white">
        {champion.id}
      </h1>
      <p className="mt-2 text-xs font-mono text-white/50">
        Discovered in Generation {String(champion.generation).padStart(2, "0")} · Parent: {champion.parent_id ?? "Gen0 Seed"}
      </p>

      {/* Hero Fitness Score */}
      <div className="mt-8">
        <div className="font-serif text-7xl md:text-8xl font-normal text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-200 to-amber-400">
          {champion.metrics.fitness.toFixed(1)}
        </div>
        <p className="mt-1 tracking-[0.25em] text-xs font-mono text-white/40 uppercase">
          MULTI-OBJECTIVE FITNESS
        </p>
      </div>

      {/* Delta vs Baseline Pill */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
          {deltaFitness >= 0 ? "+" : ""}{deltaFitness.toFixed(1)} pts vs baseline
        </span>
        {deltaAcc !== 0 && (
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
            {deltaAcc >= 0 ? "+" : ""}{deltaAcc.toFixed(1)}% accuracy
          </span>
        )}
      </div>

      {/* Multi-metric Breakdown Grid */}
      <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-mono tracking-wider text-white/40">ACCURACY</p>
          <p className="mt-1 font-serif text-2xl text-cyan-300">{(champion.metrics.accuracy * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-mono tracking-wider text-white/40">RELIABILITY</p>
          <p className="mt-1 font-serif text-2xl text-emerald-300">{(champion.metrics.reliability * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-mono tracking-wider text-white/40">SPEED</p>
          <p className="mt-1 font-serif text-2xl text-amber-300">{(champion.metrics.speed * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-mono tracking-wider text-white/40">COST EFF.</p>
          <p className="mt-1 font-serif text-2xl text-pink-300">{(champion.metrics.cost_efficiency * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Architecture Pipeline Representation */}
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono">
        <p className="text-[10px] text-white/40 tracking-wider">EVOLVED ROLE STRUCTURE</p>
        <p className="mt-2 text-sm text-white font-medium">{champion.genome.roles.join(" → ")}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] text-white/50">
          <span>Orchestration: <strong className="text-white">{champion.genome.orchestration}</strong></span>
          <span>·</span>
          <span>Tools: <strong className="text-white">{champion.genome.tools.join(", ")}</strong></span>
          <span>·</span>
          <span>Validators: <strong className="text-white">{champion.genome.validators.join(", ")}</strong></span>
        </div>
      </div>

      {/* Action Buttons: Deploy & View Evolution */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDeploy}
          disabled={isDeploying}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-7 py-3 text-xs font-bold tracking-[0.2em] text-black shadow-lg shadow-yellow-500/20 hover:brightness-110"
        >
          <span>{isDeploying ? "GENERATING STANDALONE CODE…" : "DEPLOY CHAMPION"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTrace(true)}
          className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-xs font-semibold tracking-wider text-white hover:bg-white/[0.08]"
        >
          INSPECT TRACE
        </button>

        <Link
          href="/lab"
          className="rounded-full border border-white/10 px-6 py-3 text-xs tracking-wider text-white/60 hover:text-white"
        >
          VIEW EVOLUTION THEATER →
        </Link>
      </div>

      {/* Deploy Code Modal */}
      {deployCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-yellow-300/30 bg-[#0d0c11] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl text-yellow-100">Standalone Champion Code</h3>
                <p className="text-xs text-white/50">{deployCode.filename} · Ready for standalone execution</p>
              </div>
              <button
                type="button"
                onClick={() => setDeployCode(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/70 p-4 font-mono text-xs text-cyan-200/90 leading-relaxed">
                {deployCode.code}
              </pre>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-white/40">Includes TensorMux inference logic & champion prompts.</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90"
                >
                  {copied ? "COPIED TO CLIPBOARD" : "COPY CODE"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([deployCode.code], { type: "text/x-python" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = deployCode.filename;
                    a.click();
                  }}
                  className="rounded-full border border-yellow-300/40 bg-yellow-400/10 px-5 py-2 text-xs font-semibold text-yellow-200 hover:bg-yellow-400/20"
                >
                  DOWNLOAD .PY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trace Viewer Modal */}
      {showTrace && (
        <TraceViewer
          specimen={champion}
          onClose={() => setShowTrace(false)}
        />
      )}
    </div>
  );
}

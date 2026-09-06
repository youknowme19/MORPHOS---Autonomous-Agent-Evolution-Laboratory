"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLab } from "@/components/LabProvider";
import { fetchAllExperiments } from "@/lib/api";
import type { ExperimentsData, Specimen } from "@/lib/api";
import { TraceViewer } from "@/components/TraceViewer";

const BENCHMARK_CARDS = [
  {
    domain: "cybersecurity",
    title: "Unfamiliar Python Repository Audit",
    goal: "Audit an unfamiliar Python repository for security vulnerabilities.",
    badge: "HIGH COMPLEXITY",
    color: "from-purple-500/20 to-indigo-500/10",
    metrics: ["Accuracy", "False Positive Rate", "Coverage", "Cost"],
  },
  {
    domain: "data_analysis",
    title: "CSV Dataset Anomaly & Trend Hunt",
    goal: "Analyze a CSV dataset and identify important anomalies and trends.",
    badge: "MEDIUM COMPLEXITY",
    color: "from-cyan-500/20 to-blue-500/10",
    metrics: ["Analytical Accuracy", "Numerical Correctness", "Efficiency"],
  },
  {
    domain: "research",
    title: "Evidence-Backed Technical Research",
    goal: "Research a technical topic and produce an evidence-backed summary.",
    badge: "MEDIUM COMPLEXITY",
    color: "from-emerald-500/20 to-teal-500/10",
    metrics: ["Factual Accuracy", "Evidence Quality", "Citations"],
  },
  {
    domain: "support",
    title: "Customer Support Ticket Triage",
    goal: "Classify a support ticket, identify the issue, and generate the appropriate response.",
    badge: "LOW COMPLEXITY",
    color: "from-amber-500/20 to-orange-500/10",
    metrics: ["Classification Accuracy", "Policy Compliance", "Latency"],
  },
];

export default function ExperimentsPage() {
  const { run, live } = useLab();
  const [experiments, setExperiments] = useState<ExperimentsData | null>(null);
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);

  useEffect(() => {
    fetchAllExperiments().then(setExperiments);
  }, []);

  const paretoFront = experiments?.pareto_front ?? [];
  const totalSpecimens = experiments?.total_specimens ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div>
        <span className="font-mono text-xs tracking-[0.24em] text-cyan-300 uppercase">
          EXPERIMENT CATALOG & WORKFLOW
        </span>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">Closed-Loop Evolution Trials</h1>
        <p className="mt-2 text-sm text-white/50">
          Every experiment evaluates a population of specimen architectures against ground-truth environments.
        </p>
      </div>

      {/* Pareto Frontier Summary */}
      {totalSpecimens > 0 && (
        <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/20 to-black/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-xs text-emerald-300 font-semibold tracking-wider">MULTI-OBJECTIVE PARETO FRONTIER</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="rounded-full bg-white/5 px-3 py-1 text-white/50">{totalSpecimens} TOTAL SPECIMENS</span>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-300">{experiments?.pareto_count} ON FRONTIER</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {paretoFront.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                onClick={() => setSelectedSpecimen(s)}
              >
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-cyan-300 font-semibold">{s.id}</span>
                  <span className="text-white/40">GEN {s.generation}</span>
                  <span className="text-white/60">{s.genome.roles.join(" → ")}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs">
                  <span className="text-white font-semibold">{s.metrics.fitness.toFixed(1)} pts</span>
                  <span className="text-amber-300">{(s.metrics.accuracy * 100).toFixed(0)}% acc</span>
                  <span className="text-cyan-300 text-[11px] underline">[VIEW TRACE]</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Run Status Card */}
      {run ? (
        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/20 to-black/60 p-6 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-xs text-cyan-300 font-semibold">{run.id}</span>
              <span className="mx-2 text-white/35">·</span>
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-200 uppercase">
                STATUS: {run.status}
              </span>
            </div>
            <Link
              href="/lab"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-cyan-100"
            >
              Go to Live Lab →
            </Link>
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-white">{run.task.goal}</h2>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-mono">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-white/40 text-[10px]">DOMAIN</span>
              <p className="mt-1 text-white font-medium">{run.task.domain}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-white/40 text-[10px]">COMPLEXITY</span>
              <p className="mt-1 text-white font-medium">{run.task.complexity}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-white/40 text-[10px]">GENERATION</span>
              <p className="mt-1 text-white font-medium">Gen {run.generation}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-white/40 text-[10px]">EVALUATED</span>
              <p className="mt-1 text-cyan-300 font-medium">{live.length} specimens</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md">
          <p className="text-sm text-white/50">No experiment active currently.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-black hover:bg-cyan-100"
          >
            Launch from Lab →
          </Link>
        </div>
      )}

      {/* Benchmark Environments Showcase */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Multi-Domain Benchmark Environments</h2>
        <p className="mt-1 text-xs text-white/50">
          Deterministic ground-truth environments ensuring reproducible evaluation and measurable generation gains.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENCHMARK_CARDS.map((card) => (
            <div
              key={card.domain}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all hover:border-white/25"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/50">
                    {card.badge}
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300">{card.domain}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-white">{card.title}</h3>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">{card.goal}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.metrics.map((m) => (
                    <span key={m} className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <Link
                  href={`/lab?goal=${encodeURIComponent(card.goal)}&mode=benchmark&domain=${card.domain}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white"
                >
                  <span>Launch Benchmark Trial</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trace Inspector Modal */}
      <TraceViewer
        specimen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
      />
    </div>
  );
}

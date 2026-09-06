"use client";

import { useEffect, useState } from "react";
import { useLab } from "@/components/LabProvider";
import { TraceViewer } from "@/components/TraceViewer";
import { fetchAllSpecimens } from "@/lib/api";
import type { Specimen } from "@/lib/api";

export default function TelemetryPage() {
  const { run, live } = useLab();
  const [globalSpecimens, setGlobalSpecimens] = useState<Specimen[]>([]);
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);

  useEffect(() => {
    fetchAllSpecimens().then(setGlobalSpecimens);
  }, []);

  // Merge: live (current session) + global (all historical), deduplicate by id
  const allSpecimens = [
    ...live,
    ...globalSpecimens.filter((gs) => !live.some((l) => l.id === gs.id)),
  ];

  const telemetry = (run?.telemetry ?? {}) as {
    executions?: number;
    tool_calls?: number;
    successful_runs?: number;
    failures?: number;
    average_latency_ms?: number;
    average_cost_usd?: number;
    tool_usage?: Record<string, number>;
  };

  // Compute telemetry from all specimens when no live run telemetry is available
  const toolUsageMap: Record<string, number> = {};
  let totalLatency = 0;
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const s of allSpecimens) {
    if (s.trace) {
      totalLatency += s.trace.latency_ms ?? 0;
      totalCost += s.trace.cost_usd ?? 0;
      for (const tc of s.trace.tool_calls ?? []) {
        toolUsageMap[tc.tool] = (toolUsageMap[tc.tool] ?? 0) + 1;
      }
    }
    if (s.metrics.accuracy >= 0.67) successCount++;
    else failureCount++;
  }

  const usage = Object.keys(telemetry.tool_usage ?? {}).length > 0 ? telemetry.tool_usage! : toolUsageMap;
  const totalToolCalls = Object.values(usage).reduce((acc, v) => acc + v, 0);
  const avgLatency = allSpecimens.length > 0 ? totalLatency / allSpecimens.length : 0;
  const avgCost = allSpecimens.length > 0 ? totalCost / allSpecimens.length : 0;

  const avgReliability =
    allSpecimens.length > 0
      ? (allSpecimens.reduce((acc, s) => acc + s.metrics.reliability, 0) / allSpecimens.length) * 100
      : 0;
  const totalTokens = allSpecimens.reduce((acc, s) => acc + ((s.trace?.tokens ?? 0) || (s.metrics.tokens ?? 0)), 0);


  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div>
        <span className="font-mono text-xs tracking-[0.24em] text-cyan-300 uppercase">
          ENGINEERING TELEMETRY & OBSERVABILITY
        </span>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">Execution Metrics</h1>
        <p className="mt-2 text-sm text-white/50">
          Measured from actual specimen execution traces — zero simulated or fabricated metrics.{" "}
          <span className="text-white/30">{allSpecimens.length} traces across all runs.</span>
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {[
          ["TOTAL EXECUTIONS", telemetry.executions ?? allSpecimens.length, "Runs across all generations"],
          ["TOTAL TOOL CALLS", telemetry.tool_calls ?? totalToolCalls, "Dispatched against worlds"],
          ["SUCCESSFUL RUNS", telemetry.successful_runs ?? successCount, "Met accuracy threshold"],
          ["DIAGNOSED FAILURES", telemetry.failures ?? failureCount, "Analyzed & mutated"],
          ["AVG LATENCY", `${(telemetry.average_latency_ms ?? avgLatency).toFixed(0)}ms`, "Roundtrip pipeline time"],
          ["AVG RUN COST", `$${(telemetry.average_cost_usd ?? avgCost).toFixed(4)}`, "Tokens + inference compute"],
          ["AVG RELIABILITY", `${avgReliability.toFixed(1)}%`, "Ground-truth adherence"],
          ["TOTAL TOKENS", totalTokens.toLocaleString(), "Consumed in experiment"],
        ].map(([label, value, sub]) => (
          <div key={String(label)} className="rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            <p className="text-[10px] font-mono tracking-[0.2em] text-white/40">{label}</p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">{value}</p>
            <p className="mt-1 text-[10px] text-white/40 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tool Usage Breakdown */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Tool Invocation Distribution</h2>
            <p className="text-xs text-white/50">Detailed count of tool actions dispatched during evolution</p>
          </div>
          <span className="font-mono text-xs text-cyan-300 font-semibold">{totalToolCalls} TOTAL CALLS</span>
        </div>

        {Object.keys(usage).length === 0 ? (
          <p className="py-8 text-center text-xs text-white/40">No tool calls logged yet. Run an experiment in the lab.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {Object.entries(usage)
              .sort(([, a], [, b]) => b - a)
              .map(([tool, count]) => {
                const percent = totalToolCalls > 0 ? (count / totalToolCalls) * 100 : 0;
                return (
                  <div key={tool} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white font-medium">{tool}</span>
                      <span className="text-white/60">
                        {count} calls ({percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Executed Specimen Trace Audit Log */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Specimen Trace Audit Log</h2>
            <p className="text-xs text-white/50">Click any execution trace to inspect tool calls and claims</p>
          </div>
          <span className="text-xs text-white/40 font-mono">{allSpecimens.length} TRACES</span>
        </div>

        <div className="mt-4 divide-y divide-white/5">
          {allSpecimens.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/40">No traces available.</p>
          ) : (
            allSpecimens.map((specimen) => (
              <div
                key={specimen.id}
                onClick={() => setSelectedSpecimen(specimen)}
                className="flex cursor-pointer items-center justify-between py-3.5 transition-colors hover:bg-white/[0.02] px-2 rounded-xl"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cyan-300">{specimen.id}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/40">
                      GEN {specimen.generation}
                    </span>
                    {specimen.champion && (
                      <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-300">
                        CHAMPION
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 font-mono truncate max-w-md">
                    {specimen.genome.roles.join(" → ")}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-white font-semibold">{specimen.metrics.fitness.toFixed(1)} pts</span>
                  <span className="text-white/40">{specimen.metrics.latency_ms.toFixed(0)}ms</span>
                  <span className="text-amber-300/80">${specimen.metrics.cost_usd.toFixed(4)}</span>
                  <span className="text-cyan-300 text-[11px] underline">[VIEW TRACE]</span>
                </div>
              </div>
            ))
          )}
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

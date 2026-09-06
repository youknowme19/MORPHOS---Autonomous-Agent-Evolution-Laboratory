"use client";

import { useState } from "react";
import type { Specimen } from "@/lib/api";

type TraceViewerProps = {
  specimen: Specimen | null;
  onClose: () => void;
};

export function TraceViewer({ specimen, onClose }: TraceViewerProps) {
  const [activeTab, setActiveTab] = useState<"tools" | "claims" | "reflection" | "synthesis" | "raw">("tools");

  if (!specimen) return null;
  const trace = specimen.trace;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-white/15 bg-[#0b0c12] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold tracking-tight text-white">{specimen.id} Trace</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] tracking-wider text-cyan-200 font-mono">
                GEN {String(specimen.generation).padStart(2, "0")}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] tracking-wider text-purple-200 font-mono">
                {trace?.provider ?? "local-policy"}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/50">{specimen.genome.roles.join(" → ")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 hover:border-white/30 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Telemetry quick strip */}
        <div className="grid grid-cols-2 gap-2 border-b border-white/5 bg-white/[0.02] px-6 py-3 text-xs sm:grid-cols-4 sm:gap-4">
          <div>
            <span className="text-white/40">Fitness:</span>{" "}
            <strong className="text-emerald-300 font-mono">{specimen.metrics.fitness.toFixed(1)}</strong>
          </div>
          <div>
            <span className="text-white/40">Latency:</span>{" "}
            <strong className="text-white font-mono">{trace?.latency_ms.toFixed(0) ?? specimen.metrics.latency_ms.toFixed(0)}ms</strong>
          </div>
          <div>
            <span className="text-white/40">Tokens:</span>{" "}
            <strong className="text-white font-mono">{trace?.tokens ?? specimen.metrics.tokens}</strong>
          </div>
          <div>
            <span className="text-white/40">Cost:</span>{" "}
            <strong className="text-amber-300 font-mono">${(trace?.cost_usd ?? specimen.metrics.cost_usd).toFixed(5)}</strong>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-white/10 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={`border-b-2 px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "tools"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            TOOL CALLS ({trace?.tool_calls.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`border-b-2 px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "claims"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            CLAIMS & EVIDENCE ({trace?.claims.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reflection")}
            className={`border-b-2 px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "reflection"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            SELF-REFLECTION & LEARNINGS ({trace?.tool_learnings?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("synthesis")}
            className={`border-b-2 px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "synthesis"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            OUTPUT SYNTHESIS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`border-b-2 px-4 py-3 text-xs font-medium tracking-wider whitespace-nowrap transition-colors ${
              activeTab === "raw"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            RAW JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "reflection" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 font-mono text-xs">
                  <span className="font-bold text-emerald-300 uppercase tracking-wider">
                    SPECIMEN SELF-REFLECTION & EVALUATION
                  </span>
                  <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-white/50">
                    EFFICIENCY SCORE: {((trace?.self_reflection?.efficiency_score ?? 0.5) * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-sm font-sans text-white/90 leading-relaxed">
                  {trace?.self_reflection?.critique || "Agent executed successfully with full evidence adherence."}
                </p>

                {trace?.self_reflection?.tool_critique && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-orange-200/90">
                    <span className="font-bold text-orange-400">Tool Critique: </span>
                    {trace.self_reflection.tool_critique}
                  </div>
                )}

                {trace?.self_reflection?.improvement_plan && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-emerald-300">
                    <span className="font-bold text-emerald-400">Tactical Improvement Plan: </span>
                    {trace.self_reflection.improvement_plan}
                  </div>
                )}
              </div>

              {/* Tool Learnings */}
              <div>
                <h4 className="font-mono text-xs tracking-wider text-white/40 uppercase mb-3">
                  CONTEXTUAL RULES LEARNED FROM TOOLS ({trace?.tool_learnings?.length ?? 0})
                </h4>
                {(!trace?.tool_learnings || trace.tool_learnings.length === 0) ? (
                  <p className="text-xs text-white/40 font-mono">No new contextual rules extracted in this run.</p>
                ) : (
                  <div className="space-y-2">
                    {trace.tool_learnings.map((learning, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 font-mono text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-cyan-300 uppercase">{learning.category}</span>
                          <span className="text-white/40">Tool: {learning.tool} · {(learning.confidence * 100).toFixed(0)}% CONF</span>
                        </div>
                        <p className="text-white/90 font-sans text-xs">{learning.rule}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "tools" && (
            <div className="space-y-3">
              {!trace?.tool_calls || trace.tool_calls.length === 0 ? (
                <p className="text-sm text-white/40">No tool calls recorded.</p>
              ) : (
                trace.tool_calls.map((call, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white">{call.tool}</span>
                        <span className="text-white/40">role: {call.role}</span>
                      </div>
                      <span className="text-[10px] text-white/30">DISPATCHED</span>
                    </div>
                    {Object.keys(call.arguments).length > 0 && (
                      <div className="mt-2 text-white/70">
                        <span className="text-white/40">Arguments: </span>
                        {JSON.stringify(call.arguments, null, 2)}
                      </div>
                    )}
                    <div className="mt-2 text-white/55">
                      <span className="text-white/40">Result: </span>
                      <pre className="mt-1 max-h-32 overflow-x-auto whitespace-pre-wrap rounded bg-white/[0.02] p-2 text-[11px] text-emerald-300/90">
                        {call.result}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "claims" && (
            <div className="space-y-3">
              {!trace?.claims || trace.claims.length === 0 ? (
                <p className="text-sm text-white/40">No claims extracted.</p>
              ) : (
                trace.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className={`rounded-2xl border p-4 text-xs ${
                      claim.supported
                        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                        : "border-rose-500/20 bg-rose-500/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/40">{claim.id}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
                          claim.supported
                            ? "bg-emerald-400/20 text-emerald-300"
                            : "bg-rose-400/20 text-rose-300"
                        }`}
                      >
                        {claim.supported ? "SUPPORTED" : "UNSUPPORTED / FALSE POSITIVE"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{claim.text}</p>
                    {claim.evidence && (
                      <div className="mt-2 text-white/50">
                        <span className="text-white/30">Evidence: </span>
                        <code className="text-emerald-200/80">{claim.evidence}</code>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "synthesis" && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-[11px] tracking-wider text-white/40">FINAL ANSWER</p>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/80">
                {trace?.final_answer || "No synthesis available."}
              </pre>
              {trace?.errors && trace.errors.length > 0 && (
                <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
                  <span className="font-bold">Errors: </span>
                  {trace.errors.join(", ")}
                </div>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <pre className="max-h-96 overflow-auto rounded-2xl border border-white/10 bg-black/60 p-4 font-mono text-[11px] text-cyan-200/80">
              {JSON.stringify(trace, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-white/40">
          <span>Target: {trace?.input ?? "Task objective"}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-white/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

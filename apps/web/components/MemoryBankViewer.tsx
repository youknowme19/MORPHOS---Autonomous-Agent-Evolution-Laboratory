"use client";

import { useState } from "react";
import type { LearnedContext } from "@/lib/api";

type MemoryBankViewerProps = {
  memoryBank: LearnedContext[];
  reflections?: {
    specimen_id: string;
    generation: number;
    critique: string;
    tool_critique: string;
    improvement_plan: string;
  }[];
  className?: string;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  contextual_logic: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/30" },
  api_schema: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/30" },
  failure_prevention: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/30" },
  tool_efficiency: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
};

export function MemoryBankViewer({
  memoryBank = [],
  reflections = [],
  className = "",
}: MemoryBankViewerProps) {
  const [activeTab, setActiveTab] = useState<"rules" | "reflections">("rules");
  const [filterTool, setFilterTool] = useState<string>("all");

  const tools = Array.from(new Set(memoryBank.map((e) => e.tool))).filter(Boolean);

  const filteredRules = memoryBank.filter((e) => {
    if (filterTool === "all") return true;
    return e.tool === filterTool;
  });

  return (
    <div className={`rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs tracking-[0.24em] text-emerald-300 uppercase font-semibold">
              EPISTEMIC MEMORY BANK & REFLECTION ENGINE
            </span>
          </div>
          <h2 className="mt-1 font-serif text-2xl text-white">Cross-Generational Learning</h2>
          <p className="mt-1 text-xs text-white/50">
            Agents analyze data from tools & third-party APIs, store contextual logic, and apply it in later runs.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-full border border-white/10 bg-white/[0.02] p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              activeTab === "rules" ? "bg-white text-black font-semibold shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            Learned Context ({memoryBank.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reflections")}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              activeTab === "reflections" ? "bg-white text-black font-semibold shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            Self-Reflections ({reflections.length})
          </button>
        </div>
      </div>

      {/* Rules View */}
      {activeTab === "rules" && (
        <div className="mt-4 space-y-4">
          {/* Tool filter bar */}
          {tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-white/40 mr-1 text-[10px]">FILTER BY TOOL:</span>
              <button
                type="button"
                onClick={() => setFilterTool("all")}
                className={`rounded-full px-2.5 py-0.5 text-[10px] transition-colors ${
                  filterTool === "all" ? "bg-white text-black font-bold" : "border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                All
              </button>
              {tools.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterTool(t)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] transition-colors ${
                    filterTool === t ? "bg-cyan-400 text-black font-bold" : "border border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {filteredRules.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40 font-mono">
              Memory Bank is currently empty. Run an evolution trial to see agents extract contextual logic.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredRules.map((rule) => {
                const style = CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.contextual_logic;
                return (
                  <div
                    key={rule.id}
                    className={`rounded-2xl border ${style.border} ${style.bg} p-4 text-xs font-mono space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                        {rule.category.replace(/_/g, " ")}
                      </span>
                      <span className="rounded bg-black/40 px-2 py-0.5 text-[9px] text-white/50">
                        GEN {rule.generation} · {(rule.confidence * 100).toFixed(0)}% CONF
                      </span>
                    </div>

                    <p className="text-sm font-sans font-medium text-white/90 leading-relaxed">
                      {rule.rule}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-white/40">
                      <span>Tool target: <strong className="text-white/70">{rule.tool}</strong></span>
                      <span>Source: {rule.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reflections View */}
      {activeTab === "reflections" && (
        <div className="mt-4 space-y-3">
          {reflections.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40 font-mono">
              No self-reflections logged yet. Run an experiment in the lab.
            </div>
          ) : (
            reflections.map((ref, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/50 p-4 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300">{ref.specimen_id}</span>
                    <span className="text-[10px] text-white/40">GEN {ref.generation} POST-MORTEM</span>
                  </div>
                  <span className="text-[10px] text-emerald-300">SELF-REFLECTION LOGGED</span>
                </div>

                <div className="text-white/80 font-sans leading-relaxed">
                  {ref.critique}
                </div>

                {ref.tool_critique && (
                  <div className="text-orange-200/90 text-[11px] leading-relaxed">
                    <span className="font-bold text-orange-400">Tool Critique: </span>
                    {ref.tool_critique}
                  </div>
                )}

                {ref.improvement_plan && (
                  <div className="text-emerald-300 text-[11px] leading-relaxed">
                    <span className="font-bold text-emerald-400">Tactical Improvement Plan: </span>
                    {ref.improvement_plan}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

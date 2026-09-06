"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Session = {
  name: string;
  objective: string;
  result: string;
  phase?: string;
  at?: string;
};

export default function AOPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_URL}/api/ao`)
      .then((res) => res.json())
      .then((payload) => setSessions(payload.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const phases = Array.from(new Set(sessions.map((s) => s.phase || "Engineering"))).filter(Boolean);

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === "all") return true;
    return (s.phase || "Engineering") === activeFilter;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header Banner */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-xs font-mono text-violet-300">
          <span className="font-mono text-[9px] font-bold text-violet-300">[AO]</span>
          <span>AGENT ORCHESTRATOR (AO) ENGINEERING LOG</span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white">
          AO Orchestrates MORPHOS. MORPHOS Evolves Agents.
        </h1>
        <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-2xl">
          AO is the engineering control plane used to design architecture, evaluate implementations, analyze failures,
          and optimize MORPHOS. TensorMux serves as the inference plane. Neither is a cosmetic badge.
        </p>
      </div>

      {/* Conceptual Hierarchy Flow (Section 44.16) */}
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <p className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
          SYSTEM ARCHITECTURE HIERARCHY
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 font-bold text-violet-300">
            AO Orchestrator
          </span>
          <span className="text-white/30">↓ builds</span>
          <span className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-bold text-cyan-300">
            MORPHOS Laboratory
          </span>
          <span className="text-white/30">↓ evolves</span>
          <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-300">
            Candidate Agents
          </span>
          <span className="text-white/30">↓ executes</span>
          <span className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-300">
            Benchmark Worlds
          </span>
          <span className="text-white/30">↓ evaluates</span>
          <span className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 font-bold text-yellow-300">
            Champion Agent
          </span>
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeFilter === "all" ? "bg-white text-black font-semibold" : "border border-white/10 text-white/50 hover:text-white"
          }`}
        >
          All ({sessions.length})
        </button>
        {phases.map((ph) => (
          <button
            key={ph}
            type="button"
            onClick={() => setActiveFilter(ph)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === ph ? "bg-white text-black font-semibold" : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {ph}
          </button>
        ))}
      </div>

      {/* Sessions Timeline Cards */}
      <div className="space-y-4">
        {filteredSessions.map((session, idx) => (
          <article
            key={session.name}
            className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition-all hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-semibold text-violet-300">{session.name}</span>
                {session.phase && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-0.5 text-[9px] font-mono text-violet-200">
                    {session.phase}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-white/35">SESSION #{idx + 1}</span>
            </div>

            <h2 className="mt-3 text-base font-semibold tracking-tight text-white">{session.objective}</h2>

            <div className="mt-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs font-mono leading-relaxed text-emerald-200/90">
              <span className="font-bold text-white/40 tracking-wider">ENGINEERING OUTCOME: </span>
              {session.result}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

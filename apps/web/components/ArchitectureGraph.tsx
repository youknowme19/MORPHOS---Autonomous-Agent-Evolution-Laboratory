"use client";

import { useMemo } from "react";
import type { Specimen } from "@/lib/api";

type ArchitectureGraphProps = {
  specimen?: Specimen | null;
  activeRole?: string | null;
  className?: string;
  isMutated?: boolean;
};

const ROLE_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  planner: { label: "Planner", icon: "PLN", desc: "Task decomposition & search budgeting", color: "#a78bfa" },
  generalist: { label: "Generalist", icon: "GEN", desc: "Direct single-pass execution", color: "#60a5fa" },
  executor: { label: "Executor", icon: "EXE", desc: "Tool execution & artifact gathering", color: "#22d3ee" },
  researcher: { label: "Researcher", icon: "RSR", desc: "Deep ground-truth inspection", color: "#34d399" },
  specialist: { label: "Specialist", icon: "SPC", desc: "Domain-specific reasoning & analysis", color: "#38bdf8" },
  router: { label: "Router", icon: "RTR", desc: "Dynamic query routing to agents", color: "#f472b6" },
  critic: { label: "Critic", icon: "CRT", desc: "Adversarial verification & claim audit", color: "#fbbf24" },
  validator: { label: "Validator", icon: "VAL", desc: "Evidence & consistency validation", color: "#34d399" },
  recovery: { label: "Recovery", icon: "RCV", desc: "Failure backtracking & miss recovery", color: "#fb923c" },
  finalizer: { label: "Finalizer", icon: "FIN", desc: "Synthesis & policy-compliant response", color: "#fcd34d" },
};

export function ArchitectureGraph({
  specimen,
  activeRole,
  className = "",
  isMutated = false,
}: ArchitectureGraphProps) {
  const roles = specimen?.genome.roles ?? ["planner", "researcher", "validator", "finalizer"];
  const tools = specimen?.genome.tools ?? [];
  const memory = specimen?.genome.memory ?? "none";
  const searchBudget = specimen?.genome.search_budget ?? 2;

  const nodePositions = useMemo(() => {
    const total = roles.length;
    const width = 640;
    const spacing = width / Math.max(total, 1);
    return roles.map((role, idx) => ({
      role,
      x: spacing * idx + spacing / 2,
      y: 75,
      meta: ROLE_META[role] || { label: role, icon: role.slice(0, 3).toUpperCase(), desc: role, color: "#6366f1" },
      isNew: isMutated && (role === "validator" || role === "recovery" || role === "planner"),
      isActive: activeRole ? activeRole.toLowerCase() === role.toLowerCase() : false,
    }));
  }, [roles, activeRole, isMutated]);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="tracking-[0.2em] text-white/50">
            ARCHITECTURE GRAPH {specimen ? `· ${specimen.genome.orchestration.toUpperCase()}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span>Memory: <strong className="text-white/70">{memory}</strong></span>
          <span>Budget: <strong className="text-white/70">{searchBudget}</strong></span>
          <span>Tools: <strong className="text-white/70">{tools.length}</strong></span>
        </div>
      </div>

      <div className="relative mt-4 w-full overflow-x-auto py-2">
        <svg viewBox="0 0 640 150" className="mx-auto min-w-[580px] w-full max-w-3xl overflow-visible">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="50%" stopColor="rgba(94, 234, 212, 0.6)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connectors / Edges between consecutive nodes */}
          {nodePositions.map((node, i) => {
            if (i === 0) return null;
            const prev = nodePositions[i - 1];
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={prev.x}
                  y1={prev.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <line
                  x1={prev.x}
                  y1={prev.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="url(#edgeGrad)"
                  strokeWidth="2.5"
                  className="animate-pulse"
                />
                {/* Flow particle */}
                <circle r="3" fill="#5eead4" filter="url(#glow)">
                  <animateMotion
                    path={`M ${prev.x} ${prev.y} L ${node.x} ${node.y}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodePositions.map((node, idx) => (
            <g key={`node-${idx}`} transform={`translate(${node.x}, ${node.y})`}>
              {/* Pulse ripple if active */}
              {node.isActive && (
                <circle r="36" fill="none" stroke={node.meta.color} strokeWidth="1.5" className="animate-ping opacity-70" />
              )}
              {/* Mutated glow */}
              {node.isNew && (
                <circle r="32" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" filter="url(#glow)" />
              )}

              {/* Node Outer Circle */}
              <circle
                r="24"
                fill="#0d0e15"
                stroke={node.isNew ? "#10b981" : node.isActive ? "#38bdf8" : "rgba(255,255,255,0.2)"}
                strokeWidth={node.isActive || node.isNew ? "2.5" : "1.5"}
                className="transition-all duration-300 hover:stroke-white cursor-pointer"
              />

              {/* Monospace Role Acronym */}
              <text textAnchor="middle" dy="4" fontSize="10" fontWeight="bold" fontFamily="monospace" fill={node.meta.color} className="select-none pointer-events-none tracking-wider">
                {node.meta.icon}
              </text>

              {/* Mutation badge */}
              {node.isNew && (
                <g transform="translate(14, -18)">
                  <rect width="28" height="13" rx="6" fill="#10b981" />
                  <text x="14" y="9.5" textAnchor="middle" fontSize="8" fill="#000" fontWeight="bold">
                    NEW
                  </text>
                </g>
              )}

              {/* Label */}
              <text
                textAnchor="middle"
                y="40"
                fontSize="11"
                fill={node.isNew ? "#34d399" : node.isActive ? "#38bdf8" : "#e2e8f0"}
                fontWeight="500"
                className="select-none"
              >
                {node.meta.label}
              </text>

              {/* Sub-label role sequence */}
              <text textAnchor="middle" y="52" fontSize="9" fill="rgba(255,255,255,0.4)" className="select-none">
                STEP {idx + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Tool badges active in genome */}
      {tools.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
          <span className="text-[10px] tracking-[0.15em] text-white/40">AVAILABLE TOOLS:</span>
          {tools.map((tool) => (
            <span
              key={tool}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/70 font-mono"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

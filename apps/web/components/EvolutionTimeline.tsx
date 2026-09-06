"use client";

import { useMemo, useState } from "react";
import type { Specimen } from "@/lib/api";

type MetricKey = "fitness" | "accuracy" | "reliability" | "speed" | "cost_efficiency" | "latency_ms" | "cost_usd";

type EvolutionTimelineProps = {
  specimens: Specimen[];
  className?: string;
  onSelectSpecimen?: (specimen: Specimen) => void;
};

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; format: (v: number) => string; color: string; scale: (v: number) => number }
> = {
  fitness: {
    label: "Fitness Score",
    unit: "pts",
    format: (v) => v.toFixed(1),
    color: "#a78bfa", // violet
    scale: (v) => Math.min(100, Math.max(0, v)),
  },
  accuracy: {
    label: "Accuracy",
    unit: "%",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    color: "#38bdf8", // cyan
    scale: (v) => v * 100,
  },
  reliability: {
    label: "Reliability",
    unit: "%",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    color: "#34d399", // emerald
    scale: (v) => v * 100,
  },
  speed: {
    label: "Speed",
    unit: "%",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    color: "#fbbf24", // amber
    scale: (v) => v * 100,
  },
  cost_efficiency: {
    label: "Cost Efficiency",
    unit: "%",
    format: (v) => `${(v * 100).toFixed(1)}%`,
    color: "#f472b6", // pink
    scale: (v) => v * 100,
  },
  latency_ms: {
    label: "Latency",
    unit: "ms",
    format: (v) => `${v.toFixed(0)}ms`,
    color: "#fb923c", // orange
    scale: (v) => Math.min(100, (v / 2000) * 100),
  },
  cost_usd: {
    label: "Cost",
    unit: "$",
    format: (v) => `$${v.toFixed(4)}`,
    color: "#cbd5e1", // slate
    scale: (v) => Math.min(100, (v / 0.05) * 100),
  },
};

export function EvolutionTimeline({ specimens, className = "", onSelectSpecimen }: EvolutionTimelineProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("fitness");

  // Group specimens by generation and compute best for each generation
  const generationData = useMemo(() => {
    const map = new Map<number, Specimen[]>();
    for (const s of specimens) {
      const list = map.get(s.generation) ?? [];
      list.push(s);
      map.set(s.generation, list);
    }
    const gens = Array.from(map.keys()).sort((a, b) => a - b);
    return gens.map((gen) => {
      const items = map.get(gen) ?? [];
      const best = [...items].sort((a, b) => b.metrics.fitness - a.metrics.fitness)[0];
      return {
        generation: gen,
        best,
        all: items,
        value: best ? best.metrics[selectedMetric] : 0,
      };
    });
  }, [specimens, selectedMetric]);

  const cfg = METRIC_CONFIG[selectedMetric];

  // SVG Chart points calculation
  const width = 580;
  const height = 110;
  const paddingX = 40;
  const paddingY = 20;

  const points = useMemo(() => {
    if (generationData.length === 0) return [];
    const count = generationData.length;
    const step = count > 1 ? (width - paddingX * 2) / (count - 1) : 0;
    return generationData.map((d, i) => {
      const x = count === 1 ? width / 2 : paddingX + i * step;
      const normalized = cfg.scale(d.value); // 0 to 100
      const y = height - paddingY - (normalized / 100) * (height - paddingY * 2);
      return { x, y, data: d };
    });
  }, [generationData, cfg, width, height]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[idx - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length <= 1) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
  }, [pathD, points, height]);

  return (
    <div className={`rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-white/40">EVOLUTION TIMELINE</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
              {generationData.length > 0
                ? cfg.format(generationData[generationData.length - 1].value)
                : "—"}
            </span>
            <span className="text-xs text-white/50">{cfg.unit} current leader</span>
          </div>
        </div>

        {/* Metric selection pills */}
        <div className="flex flex-wrap gap-1">
          {(["fitness", "accuracy", "reliability", "speed", "cost_efficiency"] as MetricKey[]).map((key) => {
            const isSelected = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "border border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
                }`}
              >
                {METRIC_CONFIG[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Progression Chart */}
      <div className="relative mt-4 w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.1)" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill={`url(#grad-${selectedMetric})`} />}

          {/* Line curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={cfg.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}

          {/* Interactive point nodes */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer group"
              onClick={() => onSelectSpecimen && onSelectSpecimen(pt.data.best)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill="#0b0c12"
                stroke={cfg.color}
                strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:scale-150"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="10"
                fill={cfg.color}
                className="opacity-0 group-hover:opacity-20 transition-opacity"
              />
              <text
                x={pt.x}
                y={height - 4}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.4)"
                className="font-mono"
              >
                GEN {pt.data.generation}
              </text>
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#fff"
                fontWeight="500"
                className="font-mono opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {cfg.format(pt.data.value)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Generation delta cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-4">
        {generationData.map((d) => (
          <div
            key={d.generation}
            onClick={() => onSelectSpecimen && onSelectSpecimen(d.best)}
            className="cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>GEN {d.generation}</span>
              <span className="font-mono text-cyan-300">{d.best?.id}</span>
            </div>
            <div className="mt-1 font-mono text-base font-bold tracking-tight text-white tabular-nums">
              {cfg.format(d.value)}
            </div>
            <div className="truncate text-[10px] text-white/50">
              {d.best?.genome.roles.join(" → ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

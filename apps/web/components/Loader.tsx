"use client";

import React from "react";

interface LoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({
  label = "PROCESSING...",
  sublabel,
  size = "md",
  className = "",
}: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-[2px]",
    md: "h-7 w-7 border-[2.5px]",
    lg: "h-11 w-11 border-[3px]",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div
          className={`absolute rounded-full border border-cyan-400/20 animate-ping ${
            size === "lg" ? "h-16 w-16" : size === "md" ? "h-12 w-12" : "h-7 w-7"
          }`}
        />
        {/* Main rotating spinner */}
        <div
          className={`${sizeClasses[size]} rounded-full border-cyan-400/20 border-t-cyan-400 animate-spin`}
        />
      </div>

      {label && (
        <span className="mt-4 font-mono text-xs font-bold tracking-[0.2em] text-cyan-300 animate-pulse">
          {label}
        </span>
      )}

      {sublabel && (
        <span className="mt-1 font-mono text-[10px] tracking-wider text-white/50 max-w-sm">
          {sublabel}
        </span>
      )}
    </div>
  );
}

export function ProcessingBanner({
  phase = "running",
  message = "EVOLUTIONARY PROCESSOR IN FLIGHT",
  detail = "Evaluating Pareto trade-offs across sandbox candidates...",
}: {
  phase?: string;
  message?: string;
  detail?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/40 via-black/80 to-purple-950/30 p-4 shadow-xl backdrop-blur-md">
      {/* Background scanning laser beam animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-cyan-300">
                [{message}]
              </span>
              <span className="rounded bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cyan-400 border border-cyan-400/20">
                {phase}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-white/60">
              {detail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
            LIVE KERNEL ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}

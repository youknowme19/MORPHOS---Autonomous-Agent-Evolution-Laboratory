"use client";

import { useState } from "react";
import type { Specimen } from "@/lib/api";

type FailureReplayModalProps = {
  specimen: Specimen | null;
  onClose: () => void;
  onApplyMutation?: () => void;
};

export function FailureReplayModal({ specimen, onClose, onApplyMutation }: FailureReplayModalProps) {
  const [hasApplied, setHasApplied] = useState(false);

  if (!specimen || !specimen.diagnosis) return null;

  const diagnosis = specimen.diagnosis;
  const failureCategory = diagnosis.category.replace(/_/g, " ").toUpperCase();
  const confidencePercent = (diagnosis.confidence * 100).toFixed(0);

  // Extract expected vs actual from diagnosis or trace
  const actualFindings = specimen.trace?.claims.filter((c) => !c.supported).map((c) => c.text) ?? [
    "Produced unverified assumptions without evidence.",
  ];

  const handleApply = () => {
    setHasApplied(true);
    if (onApplyMutation) {
      setTimeout(() => {
        onApplyMutation();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-orange-500/30 bg-[#0d0909] p-6 shadow-2xl">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-rose-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-ping" />
            <span className="text-xs font-semibold tracking-[0.25em] text-orange-400">
              FAILURE REPLAY · {specimen.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Summary & Category */}
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-orange-300/70">CATEGORY: {failureCategory}</span>
              <span className="font-mono text-[10px] text-orange-300">CONFIDENCE: {confidencePercent}%</span>
            </div>
            <p className="mt-2 text-sm font-medium text-white/90">{diagnosis.summary}</p>
          </div>

          {/* Expected vs Actual Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
              <span className="text-[10px] font-semibold tracking-wider text-rose-400">ACTUAL OBSERVED DEFECT</span>
              <ul className="mt-2 list-disc list-inside space-y-1 text-white/70">
                {actualFindings.slice(0, 2).map((item, idx) => (
                  <li key={idx} className="text-xs text-rose-200/90 leading-tight">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400">EXPECTED CAPABILITY</span>
              <p className="mt-2 text-xs text-emerald-200/90 leading-relaxed">
                Thoroughly inspect problem surface, require verifiable evidence, and eliminate false positives.
              </p>
            </div>
          </div>

          {/* Root Cause & AO Analysis */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-white/40">ROOT CAUSE:</span>
              <p className="mt-0.5 text-xs text-white/80">{diagnosis.root_cause}</p>
            </div>
            {diagnosis.ao_analysis && (
              <div className="border-t border-white/5 pt-2">
                <span className="text-[10px] font-mono tracking-wider text-violet-300/70">AO DIAGNOSTIC:</span>
                <p className="mt-0.5 text-xs text-violet-200/90 font-mono">{diagnosis.ao_analysis}</p>
              </div>
            )}
          </div>

          {/* Mutation Transformation Preview */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <span className="text-[10px] font-semibold tracking-wider text-emerald-300">
              TARGETED ARCHITECTURAL MUTATION
            </span>
            <p className="mt-1 text-sm font-medium text-white">{diagnosis.suggested_mutation}</p>

            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-white/70">
              <span className="rounded bg-black/40 px-2 py-1">{specimen.genome.roles.join(" → ")}</span>
              <span className="text-emerald-400 font-bold">➔</span>
              <span className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-200">
                + {diagnosis.suggested_mutation.split(" ")[0] || "Mutation"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-white/40">
            {hasApplied ? "Mutation applied to candidate genome." : "Ready to evolve next generation"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={hasApplied}
              className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wider transition-all ${
                hasApplied
                  ? "bg-emerald-500 text-black cursor-default"
                  : "bg-gradient-to-r from-orange-400 to-amber-300 text-black shadow-lg hover:brightness-110"
              }`}
            >
              {hasApplied ? "MUTATION APPLIED" : "APPLY MUTATION →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

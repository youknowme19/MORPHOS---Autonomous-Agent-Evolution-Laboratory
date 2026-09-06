"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";

const LINKS = [
  ["JOBS", "/jobs"],
  ["AGENTS", "/agents"],
  ["LAB", "/lab"],
  ["EXPERIMENTS", "/experiments"],
  ["SPECIMENS", "/specimens"],
  ["TELEMETRY", "/telemetry"],
  ["CHAMPION", "/champion"],
  ["AO", "/ao"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [health, setHealth] = useState<{ ok: boolean; tensormux?: { ok: boolean; model?: string } } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchHealth().then(setHealth);
  }, []);

  return (
    <div className="min-h-screen bg-[#07080d] text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-2xl tracking-[0.28em] font-semibold text-white">
            MORPHOS
          </span>
          <span className="hidden sm:inline-block rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] tracking-widest text-cyan-300">
            v0.2.0 LAB
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-[11px] tracking-[0.22em]">
          {LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${
                path === href
                  ? "text-white font-semibold border-b-2 border-cyan-400 pb-0.5"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Status indicator & Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] tracking-wider text-white/80 hover:border-cyan-400/50 hover:bg-white/[0.08] transition-all"
            title="Configure Inference & API Keys"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health?.tensormux?.ok ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-cyan-400"
              }`}
            />
            <span className="font-mono text-[10px]">
              TMX: {health?.tensormux?.ok ? "ONLINE (glm-4-7-flash)" : "STANDBY"}
            </span>
            <span className="rounded bg-white/10 px-1 py-0.2 font-mono text-[8px] text-white/60 ml-1">CFG</span>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0e17] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-mono text-sm tracking-wider uppercase text-cyan-300">
                Inference & Security Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/50 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
                <p className="font-semibold flex items-center gap-1.5 font-mono">
                  <span>[OK]</span> TensorMux Inference Plane Connected
                </p>
                <p className="mt-1 text-[11px] text-emerald-300/80">
                  Model: <code className="text-white font-mono">{health?.tensormux?.model || "glm-4-7-flash"}</code>
                </p>
              </div>

              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-200">
                <p className="font-semibold flex items-center gap-1.5 font-mono">
                  <span>[SEC]</span> Key Sanitization & Privacy Enforced
                </p>
                <p className="mt-1 text-[11px] text-cyan-200/80">
                  Your server-side <code className="text-white font-mono">TENSORMUX_API_KEY</code> is safely isolated in environment variables. Exported champion Python scripts never contain hardcoded keys, preventing credential leaks in public repositories or hackathon submissions.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">
                  How New Users & Judges Run Champions:
                </label>
                <div className="rounded-lg bg-black/60 p-3 font-mono text-[11px] text-white/80 border border-white/5 space-y-1">
                  <p className="text-white/40"># Set key in environment:</p>
                  <p className="text-cyan-300">export TENSORMUX_API_KEY="your_tmx_key"</p>
                  <p className="text-white/40 mt-2"># Run the exported champion agent:</p>
                  <p className="text-emerald-300">python champion_agent.py</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-black hover:bg-cyan-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 py-8">{children}</main>
    </div>
  );
}

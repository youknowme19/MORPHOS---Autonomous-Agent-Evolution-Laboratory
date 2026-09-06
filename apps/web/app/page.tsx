"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MorphField } from "@/components/MorphField";

const DOMAINS = [
  {
    id: "api_integration",
    name: "Third-Party Live API",
    icon: "[API]",
    goal: "Query third-party HackerNews API (https://hn.algolia.com/api/v1/search), discover response schema, extract top trending AI stories with points and authors, and synthesize verified intelligence.",
    badge: "REAL HTTP API",
    desc: "Hits live web endpoints over HTTP, fails on unknown schema in Gen 0, learns schema in Memory Bank, and succeeds in Gen 1+.",
  },
  {
    id: "codebase_audit",
    name: "Codebase Security",
    icon: "[FS]",
    goal: "Audit live codebase files for security vulnerabilities, hardcoded secrets, and architectural risks.",
    badge: "REAL FILESYSTEM",
    desc: "Inspects actual files with regex/grep tools, learns to prune benign debug statement false positives.",
  },
  {
    id: "cfo_finance",
    name: "CFO Finance & Ledger",
    icon: "[FIN]",
    goal: "Reconcile cross-border transaction ledgers, calculate multi-currency tax rates via Python evaluation, and flag anomalous variances.",
    badge: "REAL PYTHON MATH",
    desc: "Executes real Python computation on dirty ledger records, handles null exceptions, and reconciles tax anomalies.",
  },
  {
    id: "cybersecurity",
    name: "Python Repo Audit",
    icon: "[SEC]",
    goal: "Audit an unfamiliar Python repository for security vulnerabilities.",
    badge: "BENCHMARK WORLD",
    desc: "Detect SQL injection, leaked secrets, and DOM XSS while eliminating noisy false positives.",
  },
  {
    id: "data_analysis",
    name: "Data Anomaly Detection",
    icon: "[DATA]",
    goal: "Analyze a CSV dataset and identify important anomalies and trends.",
    badge: "BENCHMARK WORLD",
    desc: "Calculate tabular stats, locate revenue spikes, missing values, and refund surges.",
  },
  {
    id: "research",
    name: "Technical Research",
    icon: "[R&D]",
    goal: "Research a technical topic and produce an evidence-backed summary.",
    badge: "BENCHMARK WORLD",
    desc: "Retrieve KV cache & routing documentation, verify claims, and cite evidence.",
  },
  {
    id: "support",
    name: "Customer Support",
    icon: "[OPS]",
    goal: "Classify a support ticket, identify the issue, and generate the appropriate response.",
    badge: "BENCHMARK WORLD",
    desc: "Classify user intent, apply billing/security policies, and format compliant replies.",
  },
  {
    id: "github_repo",
    name: "GitHub Repo & Issue Investigator",
    icon: "[GIT]",
    goal: "Inspect unfamiliar GitHub repository https://github.com/pallets/flask, discover architecture tree, entry points, and security sensitive sinks.",
    badge: "LIVE GITHUB API",
    desc: "Inspects live GitHub repositories, analyzes tree structure without cloning, discovers language & framework, and audits security boundaries.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0].id);
  const [goal, setGoal] = useState(DOMAINS[0].goal);
  const [githubUrl, setGithubUrl] = useState("https://github.com/pallets/flask");
  const [mode, setMode] = useState<"benchmark" | "live">("live");
  const [showFitnessConfig, setShowFitnessConfig] = useState(false);
  const [fitness, setFitness] = useState({
    accuracy: 40,
    reliability: 30,
    speed: 15,
    cost_efficiency: 15,
  });

  const launchOneClick = (domainId: string, customGoal?: string) => {
    const targetDomain = DOMAINS.find((d) => d.id === domainId) ?? DOMAINS[0];
    const targetGoal = customGoal ?? targetDomain.goal;
    const fitnessQuery = `&acc=${fitness.accuracy}&rel=${fitness.reliability}&spd=${fitness.speed}&cost=${fitness.cost_efficiency}`;
    router.push(`/lab?goal=${encodeURIComponent(targetGoal)}&mode=live&domain=${domainId}${fitnessQuery}`);
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    const found = DOMAINS.find((d) => d.id === domainId);
    if (found) setGoal(found.goal);
  };

  const handleEvolve = (e: React.FormEvent) => {
    e.preventDefault();
    const encodedGoal = encodeURIComponent(goal);
    const fitnessQuery = `&acc=${fitness.accuracy}&rel=${fitness.reliability}&spd=${fitness.speed}&cost=${fitness.cost_efficiency}`;
    router.push(`/lab?goal=${encodedGoal}&mode=${mode}&domain=${selectedDomain}${fitnessQuery}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Track 1 Syndicate Hackathon Badge */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-4 py-1.5 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.25em] text-cyan-200 uppercase font-semibold">
            SYNDICATE BY MAXIMOR · TRACK 1: AUTOMATED AGENT ENGINEERING
          </span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
          Don&apos;t build an agent.
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-400 bg-clip-text text-transparent">
            Evolve one.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 leading-relaxed">
          Give MORPHOS an unfamiliar task and third-party tools. It designs candidate architectures, tests them against live data,
          analyzes real failures, distills contextual logic into a growing memory bank, and evolves a Pareto-optimal champion.
        </p>
      </div>

      {/* 1-Click Real-World Launchers Banner */}
      <div className="rounded-3xl border border-yellow-400/30 bg-gradient-to-b from-yellow-500/10 via-black/40 to-black/60 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-yellow-400/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-yellow-400/20 px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-300 tracking-wider">LIVE EXECUTION</span>
            <span className="text-xs font-mono tracking-[0.2em] font-bold text-yellow-200 uppercase">
              AGENT ENGINEERING DISPATCHERS
            </span>
          </div>
          <span className="rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-[10px] font-mono text-yellow-300">
            ZERO DUMMY DATA · REAL NETWORK & CODE EXECUTION
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Launcher 1: Live API */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition-all hover:border-cyan-400/60 hover:bg-white/[0.03]">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-300">API</span>
                <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[9px] font-mono text-cyan-200">LIVE HTTP API</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Live HackerNews API</h3>
              <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                Interacts with <code className="text-cyan-300 font-mono">hn.algolia.com</code>. Fails on unindexed schema in Gen 0, learns keys, and extracts trending AI stories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => launchOneClick("api_integration")}
              className="mt-4 w-full rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-black tracking-wider hover:bg-cyan-300 shadow-md shadow-cyan-900/30"
            >
              RUN API AGENT →
            </button>
          </div>

          {/* Launcher 2: Codebase Audit */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition-all hover:border-emerald-400/60 hover:bg-white/[0.03]">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300">FS</span>
                <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-[9px] font-mono text-emerald-200">LIVE FILESYSTEM</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Real Codebase Auditor</h3>
              <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                Dispatches real filesystem tools. Learns to distinguish benign debug statements from genuine injection flaws, eliminating 100% false positives.
              </p>
            </div>
            <button
              type="button"
              onClick={() => launchOneClick("codebase_audit")}
              className="mt-4 w-full rounded-xl bg-emerald-400 py-2.5 text-xs font-bold text-black tracking-wider hover:bg-emerald-300 shadow-md shadow-emerald-900/30"
            >
              RUN CODE AUDITOR →
            </button>
          </div>

          {/* Launcher 3: CFO Reconciler */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition-all hover:border-amber-400/60 hover:bg-white/[0.03]">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">FIN</span>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[9px] font-mono text-amber-200">CFO FINANCE TRACK</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Autonomous Ledger</h3>
              <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                Executes live Python math checks on cross-border transactions. Identifies missing null values, calculates variances, and verifies taxes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => launchOneClick("cfo_finance")}
              className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black tracking-wider hover:bg-amber-300 shadow-md shadow-amber-900/30"
            >
              RUN CFO RECONCILER →
            </button>
          </div>

          {/* Launcher 4: Live GitHub Repo Auditor (Section 11, 12, 13, 14, 51) */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/50 p-4 transition-all hover:border-purple-400/60 hover:bg-white/[0.03]">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 text-[11px] font-mono font-bold text-purple-300">GIT</span>
                <span className="rounded bg-purple-400/20 px-2 py-0.5 text-[9px] font-mono text-purple-200">LIVE GITHUB API</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">GitHub Repo Auditor</h3>
              <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                Inspects <code className="text-purple-300 font-mono">pallets/flask</code>. Explores tree structure, maps entry points, and detects sensitive sinks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => launchOneClick("github_repo", "Inspect unfamiliar GitHub repository https://github.com/pallets/flask, discover architecture tree, entry points, and security sensitive sinks.")}
              className="mt-4 w-full rounded-xl bg-purple-400 py-2.5 text-xs font-bold text-black tracking-wider hover:bg-purple-300 shadow-md shadow-purple-900/30"
            >
              RUN GITHUB AUDITOR →
            </button>
          </div>
        </div>

        {/* Live GitHub URL Explorer Bar (Section 51) */}
        <div className="mt-5 border-t border-yellow-400/20 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-white/60 shrink-0">
              <span className="rounded bg-purple-950 border border-purple-500/30 px-2 py-0.5 text-[10px] text-purple-300 font-mono">TARGET REPO:</span>
            </div>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="flex-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs font-mono text-purple-300 placeholder-white/30 focus:border-purple-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const customGoal = `Inspect unfamiliar GitHub repository ${githubUrl}, discover architecture tree, entry points, and security sensitive sinks.`;
                launchOneClick("github_repo", customGoal);
              }}
              className="w-full sm:w-auto rounded-xl bg-purple-500 px-5 py-2 text-xs font-bold text-black tracking-wider hover:bg-purple-400 transition shadow-md shadow-purple-900/30 shrink-0"
            >
              EVOLVE GITHUB AGENT →
            </button>
          </div>
        </div>
      </div>

      {/* 3D Neural Organism */}
      <MorphField phase="discovery" />

      {/* Mode Switcher: Benchmark vs Live */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs text-white/40">EXPERIMENT PLANE:</span>
        <div className="flex rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMode("live")}
            className={`rounded-full px-5 py-1.5 text-xs font-medium tracking-wider transition-all ${
              mode === "live"
                ? "bg-cyan-400 text-black shadow-md font-bold"
                : "text-white/50 hover:text-white"
            }`}
          >
            LIVE MODE (Real Third-Party Tools & TensorMux)
          </button>
          <button
            type="button"
            onClick={() => setMode("benchmark")}
            className={`rounded-full px-5 py-1.5 text-xs font-medium tracking-wider transition-all ${
              mode === "benchmark"
                ? "bg-white text-black shadow-md"
                : "text-white/50 hover:text-white"
            }`}
          >
            BENCHMARK WORLDS (Deterministic Ground Truth)
          </button>
        </div>
      </div>

      {/* Domain Selection Presets */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {DOMAINS.map((dom) => {
          const isSelected = selectedDomain === dom.id;
          return (
            <button
              key={dom.id}
              type="button"
              onClick={() => handleDomainSelect(dom.id)}
              className={`flex flex-col text-left rounded-3xl border p-4 transition-all duration-200 ${
                isSelected
                  ? "border-cyan-400/80 bg-white/[0.06] shadow-lg shadow-cyan-950/20"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300">{dom.icon}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] tracking-wider text-white/40 font-mono">
                  {dom.badge}
                </span>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-white">{dom.name}</h2>
              <p className="mt-1 text-[11px] text-white/50 line-clamp-2 leading-relaxed">{dom.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Evolution Form */}
      <form onSubmit={handleEvolve} className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between">
          <label className="text-[11px] tracking-[0.24em] font-mono text-white/50">
            {mode === "benchmark" ? "BENCHMARK OBJECTIVE" : "CUSTOM LIVE GOAL (UNSEEN OBJECTIVE)"}
          </label>
          <span className="text-[11px] text-cyan-300/80 font-mono">
            {mode === "benchmark" ? "Deterministic World Verification" : "TensorMux Dynamic Plan & Execution"}
          </span>
        </div>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-base text-white placeholder-white/30 outline-none focus:border-cyan-400/60 font-sans"
          placeholder="Enter the autonomous objective you want to evolve an agent for..."
        />

        {/* Advanced Fitness Configuration Toggle */}
        <div className="mt-4 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setShowFitnessConfig(!showFitnessConfig)}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white"
          >
            <span>{showFitnessConfig ? "▼" : "▶"}</span>
            <span>Configure Fitness Objective Weights (Section 5)</span>
          </button>

          {showFitnessConfig && (
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-4">
              <div>
                <label className="flex justify-between text-[11px] text-white/60">
                  <span>Accuracy</span>
                  <span className="font-mono text-cyan-300">{fitness.accuracy}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={fitness.accuracy}
                  onChange={(e) => setFitness({ ...fitness, accuracy: Number(e.target.value) })}
                  className="mt-1 w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] text-white/60">
                  <span>Reliability</span>
                  <span className="font-mono text-emerald-300">{fitness.reliability}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={fitness.reliability}
                  onChange={(e) => setFitness({ ...fitness, reliability: Number(e.target.value) })}
                  className="mt-1 w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] text-white/60">
                  <span>Speed</span>
                  <span className="font-mono text-amber-300">{fitness.speed}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={fitness.speed}
                  onChange={(e) => setFitness({ ...fitness, speed: Number(e.target.value) })}
                  className="mt-1 w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="flex justify-between text-[11px] text-white/60">
                  <span>Cost Eff.</span>
                  <span className="font-mono text-pink-300">{fitness.cost_efficiency}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={fitness.cost_efficiency}
                  onChange={(e) => setFitness({ ...fitness, cost_efficiency: Number(e.target.value) })}
                  className="mt-1 w-full accent-pink-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-white/40">
            Initializes Generation 0 population across {mode === "benchmark" ? "4 benchmark specimens" : "TensorMux inference specimens"}.
          </p>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs tracking-[0.2em] font-semibold text-black transition-all hover:bg-cyan-100 hover:shadow-lg hover:shadow-cyan-400/20"
          >
            <span>EVOLVE ARCHITECTURE</span>
            <span>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Job, createJob, fetchJobs, discoverCapabilities } from "@/lib/api";
import { Loader } from "@/components/Loader";

const PRESET_DOMAINS = [
  { id: "cybersecurity", label: "Cybersecurity & Vulnerability Audit" },
  { id: "api_integration", label: "Live API Discovery & Extraction" },
  { id: "github_repo", label: "GitHub Repository & Security Sink Analysis" },
  { id: "software_engineering", label: "Software Engineering & Issue Investigation" },
  { id: "data_analysis", label: "Data Analysis & Numerical Synthesis" },
  { id: "cfo_finance", label: "Financial Ledger & CFO Revenue Reconciliation" },
];

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Job Form State
  const [goal, setGoal] = useState("");
  const [domain, setDomain] = useState("cybersecurity");
  const [generations, setGenerations] = useState(3);
  const [population, setPopulation] = useState(3);
  const [discoveredCaps, setDiscoveredCaps] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-discover capabilities when goal changes
  useEffect(() => {
    if (!goal || goal.trim().length < 8) {
      setDiscoveredCaps([]);
      return;
    }
    const timer = setTimeout(async () => {
      setDiscovering(true);
      try {
        const caps = await discoverCapabilities(goal);
        setDiscoveredCaps(caps);
      } catch (err) {
        console.error(err);
      } finally {
        setDiscovering(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [goal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await createJob({
        goal,
        domain,
        target_capabilities: discoveredCaps,
        generations,
        population,
        mode: "live",
        use_llm: true,
      });

      // Navigate to live lab run stream
      if (res.run_id) {
        router.push(`/lab?run_id=${res.run_id}`);
      } else {
        await loadJobs();
        setGoal("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate agent engineering job");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Top Banner */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-cyan-300">
                [PLATFORM]
              </span>
              <h1 className="font-mono text-xl font-bold tracking-[0.2em] text-white">
                AGENT ENGINEERING JOBS
              </h1>
            </div>
            <p className="mt-2 text-xs tracking-wider text-white/50">
              Autonomous search, generation, evaluation, and mutation of production-grade candidate architectures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/agents"
              className="rounded border border-white/20 bg-white/5 px-4 py-2 font-mono text-[11px] tracking-widest text-white/80 hover:bg-white/10 transition-all"
            >
              [VIEW AGENT REGISTRY]
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Creation Wizard */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold tracking-[0.18em] text-cyan-300">
                [DISPATCH NEW JOB]
              </span>
              <span className="font-mono text-[10px] text-white/40">GENOME EXPLORATION</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Goal Input */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-white/60 uppercase mb-2">
                  Objective / Target Spec:
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Audit unfamiliar repository for security vulnerabilities and dangerous SQL execution sinks..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs text-white placeholder-white/25 focus:border-cyan-400/50 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Dynamic Inferred Capabilities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-widest text-white/60 uppercase">
                    Inferred Capabilities:
                  </span>
                  {discovering && (
                    <span className="font-mono text-[9px] text-cyan-300 animate-pulse">
                      [INFERRING...]
                    </span>
                  )}
                </div>
                <div className="min-h-[36px] rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-2 flex flex-wrap gap-1.5 items-center">
                  {discoveredCaps.length > 0 ? (
                    discoveredCaps.map((cap) => (
                      <span
                        key={cap}
                        className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300"
                      >
                        +{cap}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-[10px] text-white/30 italic">
                      Type goal to infer required tool capabilities...
                    </span>
                  )}
                </div>
              </div>

              {/* Target Domain */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-white/60 uppercase mb-2">
                  Target Domain:
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/60 p-2.5 font-mono text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                >
                  {PRESET_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id} className="bg-neutral-900">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-white/60 mb-1">
                    <span>GENERATIONS</span>
                    <span className="text-cyan-300 font-bold">{generations}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={generations}
                    onChange={(e) => setGenerations(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-white/60 mb-1">
                    <span>POPULATION</span>
                    <span className="text-cyan-300 font-bold">{population}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    value={population}
                    onChange={(e) => setPopulation(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creating || !goal.trim()}
                className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-mono text-xs font-bold tracking-[0.2em] text-black hover:bg-cyan-400 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
              >
                {creating ? "[SYNTHESIZING...]" : "[LAUNCH EVOLUTIONARY JOB]"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Jobs List */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold tracking-[0.18em] text-white">
                [REGISTERED JOBS]
              </span>
              <span className="font-mono text-[10px] text-white/40">{jobs.length} JOBS PERSISTED</span>
            </div>

            {loading ? (
              <Loader
                size="md"
                label="QUERYING JOBS CATALOG..."
                sublabel="Retrieving registered evolution synthesis jobs from persistent storage..."
              />
            ) : jobs.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-white/30">
                No active jobs found. Submit a task above to launch autonomous evolution.
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="rounded-lg border border-white/10 bg-black/40 p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">{job.job_id}</span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                            job.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : job.status === "running"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-white/5 text-white/50 border border-white/10"
                          }`}
                        >
                          [{job.status}]
                        </span>
                        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] text-white/60">
                          {job.domain}
                        </span>
                      </div>

                      {job.run_id && (
                        <Link
                          href={`/lab?run_id=${job.run_id}`}
                          className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] tracking-wider text-cyan-300 hover:bg-cyan-400/20 transition-all"
                        >
                          [STREAM RUN →]
                        </Link>
                      )}
                    </div>

                    <p className="font-mono text-xs text-white/80 line-clamp-2 mb-3">
                      {job.goal}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px] font-mono text-white/40">
                      <div className="flex items-center gap-3">
                        <span>Gens: {job.generations}</span>
                        <span>Pop: {job.population}</span>
                        {job.capabilities?.length > 0 && (
                          <span>Caps: {job.capabilities.join(", ")}</span>
                        )}
                      </div>
                      <span>{job.created_at?.slice(0, 19).replace("T", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

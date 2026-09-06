"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Agent, AgentExecutionResult, executeAgent, fetchAgents } from "@/lib/api";
import { Loader } from "@/components/Loader";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // Live execution tester state
  const [activeTesterAgent, setActiveTesterAgent] = useState<Agent | null>(null);
  const [testInput, setTestInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<AgentExecutionResult | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await fetchAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTesterAgent || !testInput.trim()) return;
    setExecuting(true);
    setExecError(null);
    setExecResult(null);

    try {
      const res = await executeAgent(activeTesterAgent.agent_id, testInput);
      setExecResult(res);
    } catch (err: any) {
      setExecError(err?.message || "Execution failed");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header Banner */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-emerald-300">
                [REGISTRY]
              </span>
              <h1 className="font-mono text-xl font-bold tracking-[0.2em] text-white">
                ENTERPRISE AGENT REGISTRY
              </h1>
            </div>
            <p className="mt-2 text-xs tracking-wider text-white/50">
              Production-ready versioned agents evolved with empirical contracts, verified evidence guarantees, and active regression tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded bg-cyan-500 px-4 py-2 font-mono text-[11px] font-bold tracking-widest text-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              [+ EVOLVE NEW AGENT]
            </Link>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <Loader
          size="lg"
          label="QUERYING AGENT REGISTRY..."
          sublabel="Loading versioned contracts, readiness metrics, and regression history..."
        />
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d0f18] p-12 text-center">
          <div className="font-mono text-xs text-white/40 mb-3">[NO PRODUCTION AGENTS REGISTERED]</div>
          <p className="font-mono text-xs text-white/60 mb-6">
            Run an evolutionary synthesis job in the Laboratory to generate your first champion agent.
          </p>
          <Link
            href="/jobs"
            className="inline-block rounded border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 font-mono text-xs text-cyan-300 hover:bg-cyan-400/20 transition-all"
          >
            [LAUNCH FIRST JOB →]
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const activeVer = agent.versions.find((v) => v.version === agent.current_version) || agent.versions[0];
            const readiness = activeVer?.readiness;
            const score = readiness?.score ?? 85.0;

            return (
              <div
                key={agent.agent_id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0d0f18] p-6 hover:border-white/20 transition-all shadow-xl"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                        {agent.current_version}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60 uppercase">
                        {agent.domain}
                      </span>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                        score >= 85
                          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : score >= 70
                          ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border border-red-500/40 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {score >= 85 ? "[DEPLOYABLE]" : score >= 70 ? "[STAGING]" : "[EXPERIMENTAL]"}
                    </span>
                  </div>

                  {/* Agent Title & Description */}
                  <h3 className="font-mono text-sm font-bold text-white mb-2">{agent.name}</h3>
                  <p className="font-mono text-xs text-white/60 line-clamp-2 mb-4">
                    {agent.description}
                  </p>

                  {/* Production Readiness Meter */}
                  <div className="rounded-lg border border-white/5 bg-black/40 p-3 mb-4">
                    <div className="flex justify-between font-mono text-[10px] mb-1.5">
                      <span className="text-white/60">PRODUCTION READINESS</span>
                      <span className="font-bold text-cyan-300">{score.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                      />
                    </div>

                    {readiness && (
                      <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-[9px] text-white/40 text-center">
                        <div>ACC: {readiness.correctness}%</div>
                        <div>REL: {readiness.reliability}%</div>
                        <div>EVD: {readiness.evidence_grounding}%</div>
                      </div>
                    )}
                  </div>

                  {/* Genome Architecture Snippet */}
                  {activeVer && (
                    <div className="font-mono text-[10px] text-white/40 space-y-1 mb-4">
                      <div>
                        <span className="text-white/60">ORCHESTRATION:</span>{" "}
                        <span className="text-white/80">{activeVer.genome.orchestration}</span>
                      </div>
                      <div>
                        <span className="text-white/60">ROLES:</span>{" "}
                        <span className="text-white/80">{activeVer.roles.join(" → ")}</span>
                      </div>
                      <div>
                        <span className="text-white/60">TOOLS:</span>{" "}
                        <span className="text-cyan-300">{activeVer.tools.join(", ")}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveTesterAgent(agent);
                      setTestInput("");
                      setExecResult(null);
                      setExecError(null);
                    }}
                    className="flex-1 rounded border border-cyan-400/40 bg-cyan-400/10 py-1.5 text-center font-mono text-[10px] tracking-wider text-cyan-300 hover:bg-cyan-400/20 transition-all"
                  >
                    [TEST AGENT]
                  </button>
                  <Link
                    href={`/agents/${agent.agent_id}`}
                    className="flex-1 rounded border border-white/20 bg-white/5 py-1.5 text-center font-mono text-[10px] tracking-wider text-white/80 hover:bg-white/10 transition-all"
                  >
                    [DETAILS & LINEAGE →]
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive In-Place Execution Modal Drawer */}
      {activeTesterAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl border border-white/20 bg-[#0d0f18] p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] text-cyan-300 uppercase tracking-widest">
                  LIVE IN-PLACE EXECUTION RUNNER
                </span>
                <h2 className="font-mono text-base font-bold text-white">
                  {activeTesterAgent.name} ({activeTesterAgent.current_version})
                </h2>
              </div>
              <button
                onClick={() => setActiveTesterAgent(null)}
                className="rounded border border-white/10 px-2 py-1 font-mono text-xs text-white/60 hover:text-white"
              >
                [CLOSE ✕]
              </button>
            </div>

            <form onSubmit={handleRunTest} className="mb-4">
              <label className="block font-mono text-[10px] tracking-widest text-white/60 uppercase mb-1.5">
                Execute On Input Task:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="e.g., Audit authentication module for secret leaks..."
                  className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={executing || !testInput.trim()}
                  className="rounded-lg bg-cyan-500 px-4 py-2 font-mono text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition-all"
                >
                  {executing ? "[RUNNING...]" : "[EXECUTE]"}
                </button>
              </div>
            </form>

            {/* Results Display */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/50 p-4 space-y-4 font-mono text-xs">
              {executing && (
                <div className="py-12 text-center text-cyan-300 animate-pulse">
                  [DISPATCHING MULTI-ROLE ORCHESTRATION PIPELINE...]
                </div>
              )}

              {execError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300">
                  {execError}
                </div>
              )}

              {execResult && (
                <div className="space-y-4">
                  {/* Top Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">
                        Run: {execResult.run_id}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] ${
                          execResult.contract_valid
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {execResult.contract_valid ? "[CONTRACT VALIDATED]" : "[CONTRACT WARNING]"}
                      </span>
                      {execResult.regression_flagged && (
                        <span className="rounded bg-red-500/20 text-red-300 px-2 py-0.5 text-[10px]">
                          [REGRESSION FLAGGED]
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50">
                      Latency: {execResult.duration_ms.toFixed(1)}ms | Tool Calls: {execResult.tool_calls.length}
                    </div>
                  </div>

                  {/* Output Preview */}
                  <div>
                    <span className="text-[10px] text-white/50 uppercase">Synthesized Output:</span>
                    <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-black/80 p-3 text-[11px] text-white/90 border border-white/5">
                      {execResult.output}
                    </pre>
                  </div>

                  {/* Verified Claims */}
                  {execResult.claims && execResult.claims.length > 0 && (
                    <div>
                      <span className="text-[10px] text-white/50 uppercase">Grounding Claims:</span>
                      <div className="mt-1 space-y-1.5 max-h-32 overflow-y-auto">
                        {execResult.claims.map((claim, idx) => (
                          <div
                            key={idx}
                            className="rounded border border-white/5 bg-white/[0.02] p-2 text-[10px] flex items-start gap-2"
                          >
                            <span className={claim.supported ? "text-emerald-400" : "text-amber-400"}>
                              {claim.supported ? "[VERIFIED]" : "[UNVERIFIED]"}
                            </span>
                            <span className="text-white/80">{claim.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool Call Traces */}
                  {execResult.tool_calls && execResult.tool_calls.length > 0 && (
                    <div>
                      <span className="text-[10px] text-white/50 uppercase">Sandbox Tool Traces:</span>
                      <div className="mt-1 space-y-1 max-h-32 overflow-y-auto text-[10px]">
                        {execResult.tool_calls.map((tc, idx) => (
                          <div key={idx} className="rounded bg-white/5 p-2 flex justify-between">
                            <span className="text-cyan-300">{tc.role} → {tc.tool}</span>
                            <span className="text-white/40 truncate max-w-xs">{tc.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {executing && (
                <div className="py-12 text-center">
                  <Loader
                    size="md"
                    label="DISPATCHING SANDBOX TOOLS..."
                    sublabel="Executing AST verification, querying boundaries, and grounding claims in evidence..."
                  />
                </div>
              )}

              {!executing && !execResult && !execError && (
                <div className="py-12 text-center text-white/30 font-mono text-xs">
                  Enter an input query above to test live execution against this evolved agent.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

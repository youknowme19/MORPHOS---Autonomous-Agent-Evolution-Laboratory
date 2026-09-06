"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Agent,
  AgentExecutionResult,
  AgentVersion,
  deployAgent,
  executeAgent,
  fetchAgent,
  rollbackAgent,
} from "@/lib/api";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>("v1");
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackMsg, setRollbackMsg] = useState<string | null>(null);

  // Playground state
  const [testInput, setTestInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<AgentExecutionResult | null>(null);
  const [execError, setExecError] = useState<string | null>(null);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  async function loadAgent() {
    try {
      const data = await fetchAgent(agentId);
      setAgent(data);
      setSelectedVersion(data.current_version || "v1");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy() {
    if (!agent) return;
    setDeploying(true);
    try {
      await deployAgent(agent.agent_id, selectedVersion);
      await loadAgent();
    } catch (err) {
      console.error(err);
    } finally {
      setDeploying(false);
    }
  }

  async function handleRollback() {
    if (!agent || agent.versions.length < 2) return;
    setRollingBack(true);
    setRollbackMsg(null);
    try {
      const res = await rollbackAgent(agent.agent_id);
      setRollbackMsg(`Rolled back to ${res.rolled_back_to}`);
      await loadAgent();
    } catch (err: any) {
      setRollbackMsg(err?.message || "Rollback failed");
    } finally {
      setRollingBack(false);
    }
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!agent || !testInput.trim()) return;
    setExecuting(true);
    setExecError(null);
    setExecResult(null);

    try {
      const res = await executeAgent(agent.agent_id, testInput, selectedVersion);
      setExecResult(res);
      // Reload to get updated continuous evaluation history
      await loadAgent();
    } catch (err: any) {
      setExecError(err?.message || "Execution error");
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-24 text-center font-mono text-xs text-white/40 animate-pulse">
        [LOADING AGENT SPECIFICATION...]
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-6xl py-24 text-center font-mono text-xs text-red-400">
        Agent not found. <Link href="/agents" className="underline text-cyan-300">Return to Registry</Link>
      </div>
    );
  }

  const currentVer = agent.versions.find((v) => v.version === selectedVersion) || agent.versions[0];
  const readiness = currentVer?.readiness;
  const contract = currentVer?.contract;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Back link & Top Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/agents"
          className="font-mono text-xs text-white/50 hover:text-cyan-300 transition-colors"
        >
          ← [BACK TO AGENT REGISTRY]
        </Link>

        <div className="flex items-center gap-3">
          {rollbackMsg && (
            <span className="font-mono text-[10px] text-amber-300">{rollbackMsg}</span>
          )}
          {agent.versions.length > 1 && (
            <button
              onClick={handleRollback}
              disabled={rollingBack}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition-all"
            >
              {rollingBack ? "[ROLLING BACK...]" : "[ROLLBACK VERSION]"}
            </button>
          )}
          {agent.current_version === selectedVersion ? (
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
              [ACTIVE DEPLOYED VERSION]
            </span>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="rounded bg-emerald-500 px-3 py-1 font-mono text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition-all"
            >
              {deploying ? "[DEPLOYING...]" : `[PROMOTE ${selectedVersion} TO PRODUCTION]`}
            </button>
          )}
        </div>
      </div>

      {/* Main Header Info */}
      <div className="mb-8 rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-cyan-300 font-bold">{agent.agent_id}</span>
              <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60 uppercase">
                {agent.domain}
              </span>
              <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/40">
                Created: {agent.created_at?.slice(0, 10)}
              </span>
            </div>
            <h1 className="font-mono text-xl font-bold text-white mb-2">{agent.name}</h1>
            <p className="font-mono text-xs text-white/60 max-w-3xl">{agent.description}</p>
          </div>

          {readiness && (
            <div className="rounded-lg border border-white/10 bg-black/50 p-4 text-center min-w-[160px]">
              <div className="font-mono text-[10px] text-white/40 uppercase mb-1">
                Readiness Score
              </div>
              <div className="font-mono text-3xl font-bold text-cyan-300">
                {readiness.score.toFixed(1)}%
              </div>
              <div className="font-mono text-[9px] text-emerald-400 mt-1 uppercase">
                [{readiness.status || "READY_FOR_DEPLOYMENT"}]
              </div>
            </div>
          )}
        </div>

        {/* Version Lineage Tabs */}
        <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 overflow-x-auto">
          <span className="font-mono text-[10px] text-white/40 uppercase mr-2">VERSIONS:</span>
          {agent.versions.map((ver) => (
            <button
              key={ver.version}
              onClick={() => setSelectedVersion(ver.version)}
              className={`rounded px-3 py-1.5 font-mono text-xs transition-all ${
                selectedVersion === ver.version
                  ? "border border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold"
                  : "border border-white/10 bg-black/40 text-white/60 hover:text-white"
              }`}
            >
              {ver.version} (Gen {ver.generation})
              {ver.version === agent.current_version && " ★"}
            </button>
          ))}
        </div>
      </div>

      {/* Version Details Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contract & Architecture Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Production Contract Card */}
          <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
                [AGENT CONTRACT GUARANTEES]
              </span>
              <span className="font-mono text-[10px] text-white/40">{selectedVersion} SPEC</span>
            </div>

            {contract ? (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-white/40 uppercase block mb-1">Purpose:</span>
                  <p className="text-white/80 bg-black/40 p-2.5 rounded border border-white/5">
                    {contract.purpose}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-white/40 uppercase block mb-1">Inputs:</span>
                    <ul className="list-disc list-inside text-white/70 space-y-0.5">
                      {contract.inputs.map((inp, i) => (
                        <li key={i}>{inp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-white/40 uppercase block mb-1">Outputs:</span>
                    <ul className="list-disc list-inside text-white/70 space-y-0.5">
                      {contract.outputs.map((out, i) => (
                        <li key={i}>{out}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <span className="text-white/40 uppercase block mb-1">Guarantees:</span>
                  <div className="space-y-1">
                    {contract.guarantees.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-emerald-400/90 text-[11px]">
                        <span>✓</span>
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {contract.known_limitations && contract.known_limitations.length > 0 && (
                  <div>
                    <span className="text-white/40 uppercase block mb-1">Known Limitations:</span>
                    <div className="space-y-1">
                      {contract.known_limitations.map((lim, i) => (
                        <div key={i} className="flex items-center gap-2 text-amber-400/90 text-[11px]">
                          <span>⚠</span>
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="font-mono text-xs text-white/40 italic">No formal contract bound.</div>
            )}
          </div>

          {/* Architecture & Roles */}
          {currentVer && (
            <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
              <div className="mb-4 border-b border-white/10 pb-3">
                <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                  [GENOME ARCHITECTURE & MULTI-ROLE GRAPH]
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">ORCHESTRATION:</span>
                  <span className="text-cyan-300 font-bold">{currentVer.genome.orchestration}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">ROLES PIPELINE:</span>
                  <span className="text-white/90">{currentVer.roles.join(" → ")}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">SEARCH BUDGET:</span>
                  <span className="text-white/90">{currentVer.genome.search_budget} calls</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/40">SANDBOX TOOLS:</span>
                  <span className="text-emerald-300">{currentVer.tools.join(", ")}</span>
                </div>
                {currentVer.mutation_applied && (
                  <div className="flex justify-between">
                    <span className="text-white/40">MUTATION APPLIED:</span>
                    <span className="text-amber-300">{currentVer.mutation_applied}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Continuous Evaluation & Regression History */}
          <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                [CONTINUOUS EVALUATION HISTORY]
              </span>
              <span className="font-mono text-[10px] text-white/40">
                {agent.continuous_eval_history?.length || 0} EXECUTIONS
              </span>
            </div>

            {agent.continuous_eval_history && agent.continuous_eval_history.length > 0 ? (
              <div className="space-y-2 overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40">
                      <th className="pb-2">EXEC ID</th>
                      <th className="pb-2">VER</th>
                      <th className="pb-2">QUALITY</th>
                      <th className="pb-2">CLAIMS</th>
                      <th className="pb-2">ERRORS</th>
                      <th className="pb-2">LATENCY</th>
                      <th className="pb-2">REGRESSION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {agent.continuous_eval_history.slice(-6).reverse().map((rec, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-white/60">{rec.execution_id}</td>
                        <td className="py-2 text-cyan-300">{rec.version_str}</td>
                        <td className="py-2 font-bold text-white">{(rec.quality_score * 100).toFixed(1)}%</td>
                        <td className="py-2 text-white/70">{rec.grounded_claims} / {rec.grounded_claims + rec.unsupported_claims}</td>
                        <td className="py-2 text-amber-400">{rec.tool_failures}</td>
                        <td className="py-2 text-white/50">{rec.duration_ms.toFixed(0)}ms</td>
                        <td className="py-2">
                          {rec.regression_detected ? (
                            <span className="text-red-400 font-bold">[FLAGGED]</span>
                          ) : (
                            <span className="text-emerald-400">[PASS]</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="font-mono text-xs text-white/30 py-4 text-center">
                No real executions recorded yet. Use the playground below to test in-place.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Readiness Breakdown & Live Runner */}
        <div className="lg:col-span-5 space-y-6">
          {/* Readiness Dimensions */}
          {readiness && (
            <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
              <div className="mb-4 border-b border-white/10 pb-3">
                <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
                  [6-DIMENSION READINESS BREAKDOWN]
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { label: "Correctness / Accuracy", val: readiness.correctness },
                  { label: "Execution Reliability", val: readiness.reliability },
                  { label: "Evidence Grounding", val: readiness.evidence_grounding },
                  { label: "Cost Efficiency", val: readiness.cost_efficiency },
                  { label: "Latency Score", val: readiness.latency_score },
                  { label: "Security Sandbox Isolation", val: readiness.security },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/60">{item.label}</span>
                      <span className="font-bold text-white">{item.val.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${Math.min(100, Math.max(5, item.val))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-Place Execution Playground */}
          <div className="rounded-xl border border-white/10 bg-[#0d0f18] p-6 shadow-xl">
            <div className="mb-4 border-b border-white/10 pb-3">
              <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                [LIVE EXECUTION PLAYGROUND]
              </span>
            </div>

            <form onSubmit={handleRun} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] text-white/50 uppercase mb-1">
                  Task Prompt:
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="e.g., Audit db.py for SQL injection or inspect trending tech items..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-black/60 p-2.5 font-mono text-xs text-white placeholder-white/25 focus:border-cyan-400/50 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={executing || !testInput.trim()}
                className="w-full rounded-lg bg-cyan-500 py-2.5 font-mono text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
              >
                {executing ? "[EXECUTING PIPELINE...]" : `[RUN AGAINST ${selectedVersion}]`}
              </button>
            </form>

            {/* Run Output */}
            {execResult && (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs space-y-2">
                <div className="flex justify-between border-b border-white/10 pb-1 text-[10px]">
                  <span className="text-emerald-400">[SUCCESS: {execResult.run_id}]</span>
                  <span className="text-white/40">{execResult.duration_ms.toFixed(1)}ms</span>
                </div>
                <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] text-white/80">
                  {execResult.output}
                </pre>
              </div>
            )}

            {execError && (
              <div className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-300">
                {execError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

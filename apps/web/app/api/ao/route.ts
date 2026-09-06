import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ao`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const sessions = [
    {
      name: "AO SESSION 01",
      phase: "Architecture",
      objective: "Project Architecture: Design the MORPHOS evolution pipeline.",
      result: "Defined Analyzer → Architect → Executor → Evaluator → Diagnostics → Mutation → Selection. All genomes are typed; fitness is multi-objective.",
    },
    {
      name: "AO SESSION 02",
      phase: "Evolution Engine",
      objective: "Evolution Engine: Make failure and improvement structural rather than hardcoded.",
      result: "Implemented deterministic benchmark worlds where tool availability, search budget, and validation directly impact claims discovered.",
    },
    {
      name: "AO SESSION 03",
      phase: "Inference",
      objective: "Agent Execution: Swappable inference with TensorMux and local fallback.",
      result: "Built ModelProvider interface with TensorMuxProvider (model: glm-4-7-flash) and MockProvider fallback for robust live/benchmark execution.",
    },
    {
      name: "AO SESSION 04",
      phase: "Evaluation",
      objective: "Evaluation Framework: Multi-objective fitness scoring.",
      result: "Implemented balanced fitness formula: 0.40 * Accuracy + 0.30 * Reliability + 0.15 * Speed + 0.15 * Cost Efficiency, with penalty for false positives.",
    },
    {
      name: "AO SESSION 05",
      phase: "Diagnostics",
      objective: "Failure Analysis: Structured root-cause diagnosis taxonomy.",
      result: "Created FailureDiagnosis taxonomy (poor_exploration, unsupported_claims, tool_thrash, incomplete_coverage) with explicit mutation suggestions.",
    },
    {
      name: "AO SESSION 06",
      phase: "Mutation",
      objective: "Mutation Engine: Architectural transformations.",
      result: "Mapped diagnosed root causes directly to mutations: adding planners, evidence validators, expanding roles, and tuning search budgets.",
    },
    {
      name: "AO SESSION 07",
      phase: "Backend API",
      objective: "Backend Integration: Real-time Server-Sent Events streaming.",
      result: "Built FastAPI SSE endpoints (/api/runs/{id}/stream) emitting task, generation, specimen_start, specimen_result, mutation, and champion events.",
    },
    {
      name: "AO SESSION 08",
      phase: "Frontend",
      objective: "UI/UX: High-performance Next.js 15 dashboard.",
      result: "Created live laboratory view, specimen inspection cards, fitness progress charts, and memory bank explorer.",
    },
    {
      name: "AO SESSION 09",
      phase: "Epistemic Memory",
      objective: "Epistemic Memory: Cross-generational lesson bank.",
      result: "Implemented global and run-scoped memory banks where failures and tool observations distill into actionable rules for subsequent generations.",
    },
    {
      name: "AO SESSION 10",
      phase: "Live Runner",
      objective: "Live World Execution: Real-world API integration.",
      result: "Added support for external live API queries (e.g. HackerNews Algolia) with real payload parsing and schema discovery.",
    },
    {
      name: "AO SESSION 11",
      phase: "Security Sandbox",
      objective: "Security Hardening: Sandbox boundaries and secrets sanitization.",
      result: "Enforced path containment against traversal, AST-based inspection of Python eval, and automated redaction of sensitive credentials.",
    },
    {
      name: "AO SESSION 12",
      phase: "Champion Promotion",
      objective: "Deployment Pipeline: Standalone champion export & registry.",
      result: "Implemented standalone champion Python script generation and production agent registry with instant version rollback capabilities.",
    },
  ];

  return NextResponse.json({ sessions });
}

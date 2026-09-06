import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const agents = [
    {
      id: "agent_8df85861",
      name: "GitHub Repo Autonomous Auditor",
      created_at: new Date().toISOString(),
      active_version: "v1",
      versions: [
        {
          version: "v1",
          created_at: new Date().toISOString(),
          genome: {
            orchestration: "planner_executor",
            tools: ["list_files", "github_inspect", "grep", "evidence_check"],
            memory: "scratchpad",
            validators: ["evidence"],
            search_budget: 6,
            prompt_traits: ["methodical", "security_focused"],
            roles: ["planner", "executor"],
          },
          readiness_score: 0.96,
          readiness_status: "READY_FOR_DEPLOYMENT",
          readiness: {
            score: 0.96,
            correctness: 0.98,
            reliability: 1.0,
            evidence_grounding: 0.95,
            cost_efficiency: 0.92,
            latency_score: 0.94,
            security: 1.0,
            reproducibility: 0.98,
            formula: "Weighted multi-objective production score",
          },
          contract: {
            purpose: "Discover repository architecture tree, entry points, and security sensitive sinks.",
            inputs: ["github_repo_url", "branch", "auth_token"],
            outputs: ["architecture_tree", "vulnerabilities", "sink_boundaries"],
            required_tools: ["github_inspect", "grep", "evidence_check"],
            success_criteria: ["100% ground-truth sink coverage", "zero unverified claims"],
          },
        },
      ],
      specimens: [
        {
          id: "S00-01",
          generation: 0,
          parent_id: null,
          champion: false,
          genome: {
            orchestration: "single_agent",
            tools: ["list_files"],
            memory: "none",
            validators: ["none"],
            search_budget: 1,
            prompt_traits: ["brief"],
            roles: ["generalist"],
          },
          metrics: {
            accuracy: 0.0,
            reliability: 1.0,
            speed: 0.51,
            cost_efficiency: 0.85,
            latency_ms: 4914,
            cost_usd: 0.00147,
            fitness: 24.6,
            false_positive_rate: 0.5,
            coverage: 0.2,
            tool_calls: 1,
            tokens: 380,
          },
        },
        {
          id: "S00-03",
          generation: 0,
          parent_id: null,
          champion: false,
          genome: {
            orchestration: "planner_executor",
            tools: ["list_files", "read_file", "grep"],
            memory: "scratchpad",
            validators: ["output"],
            search_budget: 4,
            prompt_traits: ["analytic"],
            roles: ["planner", "researcher", "finalizer"],
          },
          metrics: {
            accuracy: 0.5,
            reliability: 1.0,
            speed: 0.72,
            cost_efficiency: 0.91,
            latency_ms: 6426,
            cost_usd: 0.0028,
            fitness: 72.6,
            false_positive_rate: 0.15,
            coverage: 0.65,
            tool_calls: 4,
            tokens: 720,
          },
        },
        {
          id: "S01-03",
          generation: 1,
          parent_id: "S00-03",
          champion: true,
          genome: {
            orchestration: "planner_executor",
            tools: ["list_files", "github_inspect", "grep", "evidence_check"],
            memory: "scratchpad",
            validators: ["evidence"],
            search_budget: 6,
            prompt_traits: ["methodical", "security_focused"],
            roles: ["planner", "executor"],
          },
          metrics: {
            accuracy: 0.875,
            reliability: 1.0,
            speed: 0.89,
            cost_efficiency: 0.94,
            latency_ms: 4019,
            cost_usd: 0.00267,
            fitness: 90.3,
            false_positive_rate: 0.0,
            coverage: 0.95,
            tool_calls: 3,
            tokens: 680,
          },
        },
      ],
    },
  ];

  return NextResponse.json({ agents, count: agents.length });
}

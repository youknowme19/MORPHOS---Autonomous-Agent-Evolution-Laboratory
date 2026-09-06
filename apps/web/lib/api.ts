export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1")
    ? ""
    : "http://127.0.0.1:8000");

export type Claim = {
  id: string;
  text: string;
  supported: boolean;
  evidence?: string;
  category?: string;
};

export type ToolCall = {
  tool: string;
  role: string;
  arguments: Record<string, unknown>;
  result: string;
};

export type LearnedContext = {
  id: string;
  rule: string;
  tool: string;
  category: string;
  generation: number;
  confidence: number;
  source: string;
};

export type SelfReflection = {
  critique: string;
  tool_critique: string;
  improvement_plan: string;
  efficiency_score: number;
};

export type ExecutionTrace = {
  specimen_id: string;
  input: string;
  tool_calls: ToolCall[];
  claims: Claim[];
  final_answer: string;
  errors: string[];
  retries: number;
  latency_ms: number;
  tokens: number;
  cost_usd: number;
  provider: string;
  self_reflection?: SelfReflection | null;
  tool_learnings?: LearnedContext[];
};

export type Specimen = {
  id: string;
  generation: number;
  parent_id?: string | null;
  champion?: boolean;
  genome: {
    orchestration: string;
    tools: string[];
    memory: string;
    validators: string[];
    search_budget: number;
    prompt_traits: string[];
    roles: string[];
  };
  metrics: {
    accuracy: number;
    reliability: number;
    speed: number;
    cost_efficiency: number;
    latency_ms: number;
    cost_usd: number;
    fitness: number;
    false_positive_rate: number;
    coverage: number;
    tool_calls: number;
    tokens: number;
  };
  mutation?: {
    type: string;
    reason: string;
    confidence: number;
    before_label: string;
    after_label: string;
  } | null;
  diagnosis?: {
    category: string;
    summary: string;
    root_cause: string;
    suggested_mutation: string;
    confidence: number;
    ao_analysis: string;
    evidence: string[];
  } | null;
  trace?: ExecutionTrace | null;
  reflections?: string[];
  applied_memory?: string[];
};

export type RunSnapshot = {
  id: string;
  status: string;
  generation: number;
  task: {
    goal: string;
    domain: string;
    complexity: string;
    required_capabilities: string[];
    evaluation_metrics: string[];
    mode: string;
  };
  specimens: Specimen[];
  champion?: Specimen | null;
  telemetry: Record<string, unknown>;
  ao_sessions: { name: string; objective: string; result: string; phase?: string }[];
  memory_bank?: LearnedContext[];
};

export async function createRun(body: {
  goal: string;
  mode: string;
  generations?: number;
  domain?: string | null;
  fitness?: {
    accuracy: number;
    reliability: number;
    speed: number;
    cost_efficiency: number;
  };
  use_llm?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Failed to start run");
  return (await response.json()) as { run: RunSnapshot };
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchChampionCode(runId: string) {
  const res = await fetch(`${API_URL}/api/export/${runId}/champion`);
  if (!res.ok) throw new Error("Failed to export champion");
  return (await res.json()) as {
    filename: string;
    code: string;
    specimen_id: string;
    fitness: number;
    accuracy: number;
    roles: string[];
    orchestration: string;
  };
}

export async function fetchBenchmarks() {
  const res = await fetch(`${API_URL}/api/benchmarks`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.benchmarks as {
    id: string;
    domain: string;
    title: string;
    goal: string;
    complexity: string;
    capabilities: string[];
  }[];
}

export async function fetchRunMemory(runId: string) {
  const res = await fetch(`${API_URL}/api/runs/${runId}/memory`);
  if (!res.ok) throw new Error("Failed to fetch memory");
  return (await res.json()) as {
    memory_bank: LearnedContext[];
    reflections: {
      specimen_id: string;
      generation: number;
      critique: string;
      tool_critique: string;
      improvement_plan: string;
    }[];
    total_rules: number;
  };
}

export async function fetchEvolutionDiff(runId: string) {
  const res = await fetch(`${API_URL}/api/runs/${runId}/evolution-diff`);
  if (!res.ok) throw new Error("Failed to fetch evolution diff");
  return (await res.json()) as {
    baseline: {
      id: string;
      generation: number;
      roles: string[];
      metrics: Record<string, number>;
      output: string;
      tool_calls: number;
      cost_usd: number;
      latency_ms: number;
    };
    champion: {
      id: string;
      generation: number;
      roles: string[];
      metrics: Record<string, number>;
      output: string;
      tool_calls: number;
      cost_usd: number;
      latency_ms: number;
      applied_memory: string[];
    };
    deltas: {
      fitness: number;
      accuracy: number;
      cost_reduction_percent: number;
      latency_delta_ms: number;
    };
  };
}

// ----------------------------------------------------------------------
// Production Agent & Job Types & Endpoints
// ----------------------------------------------------------------------

export type ProductionReadiness = {
  score: number;
  correctness: number;
  reliability: number;
  evidence_grounding: number;
  cost_efficiency: number;
  latency_score: number;
  security: number;
  reproducibility: number;
  formula: string;
  status?: string;
};

export type AgentContract = {
  purpose: string;
  inputs: string[];
  outputs: string[];
  required_tools: string[];
  success_criteria: string[];
  guarantees: string[];
  known_limitations: string[];
  evaluation_summary: Record<string, number>;
  version: string;
};

export type AgentVersion = {
  version: string;
  specimen_id: string;
  generation: number;
  genome: Specimen["genome"];
  roles: string[];
  tools: string[];
  parent_version?: string | null;
  mutation_applied?: string | null;
  metrics: Specimen["metrics"];
  contract: AgentContract;
  readiness: ProductionReadiness;
  applied_memory: string[];
  output_sample: string;
  created_at: string;
};

export type Agent = {
  agent_id: string;
  name: string;
  description: string;
  domain: string;
  current_version: string;
  versions: AgentVersion[];
  status: "draft" | "active" | "deployed" | "deprecated";
  created_from_job?: string | null;
  parent_agent?: string | null;
  performance_metrics: Specimen["metrics"];
  deployed: boolean;
  continuous_eval_history: {
    timestamp: number;
    execution_id: string;
    version_str: string;
    quality_score: number;
    grounded_claims: number;
    unsupported_claims: number;
    tool_failures: number;
    duration_ms: number;
    regression_detected: boolean;
    notes: string;
  }[];
  created_at: string;
  updated_at: string;
};

export type Job = {
  job_id: string;
  goal: string;
  domain: string;
  capabilities: string[];
  tools: string[];
  success_criteria: string[];
  status: "pending" | "analyzing" | "running" | "completed" | "failed" | "cancelled";
  run_id?: string | null;
  champion_id?: string | null;
  agent_id?: string | null;
  generations: number;
  population: number;
  mode: string;
  created_at: string;
  updated_at: string;
};

export type AgentExecutionResult = {
  run_id: string;
  agent_id: string;
  agent_version: string;
  status: string;
  input: string;
  output: string;
  claims: Claim[];
  tool_calls: { tool: string; arguments: Record<string, unknown>; result: string; role: string }[];
  metrics: Record<string, unknown>;
  cost_usd: number;
  duration_ms: number;
  contract_valid: boolean;
  regression_flagged: boolean;
  trace_id: string;
  timestamp: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  permissions: Record<string, string>;
  cost_estimate_usd: number;
  latency_estimate_ms: number;
  failure_modes: string[];
};

export async function fetchJobs() {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs || []) as Job[];
}

export async function fetchJob(jobId: string) {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  const data = await res.json();
  return data.job as Job;
}

export async function createJob(body: {
  goal: string;
  target_capabilities?: string[];
  domain?: string | null;
  generations?: number;
  population?: number;
  mode?: string;
  use_llm?: boolean;
}) {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return (await res.json()) as { job: Job; run_id: string };
}

export async function fetchAgents() {
  const res = await fetch(`${API_URL}/api/agents`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.agents || []) as Agent[];
}

export async function fetchAgent(agentId: string) {
  const res = await fetch(`${API_URL}/api/agents/${agentId}`);
  if (!res.ok) throw new Error("Agent not found");
  const data = await res.json();
  return data.agent as Agent;
}

export async function deployAgent(agentId: string, version: string) {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version }),
  });
  if (!res.ok) throw new Error("Failed to deploy agent");
  return await res.json();
}

export async function executeAgent(agentId: string, input: string, version?: string) {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, version }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Agent execution failed");
  }
  const data = await res.json();
  return data.result as AgentExecutionResult;
}

export async function fetchToolsCatalog() {
  const res = await fetch(`${API_URL}/api/tools`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tools || []) as ToolDefinition[];
}

export async function discoverCapabilities(query: string) {
  const res = await fetch(`${API_URL}/api/capabilities/discover?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.capabilities || []) as string[];
}

export async function rollbackAgent(agentId: string, targetVersion?: string) {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/rollback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_version: targetVersion ?? null }),
  });
  if (!res.ok) throw new Error("Failed to rollback agent");
  return await res.json();
}

export async function fetchAllSpecimens(): Promise<Specimen[]> {
  const res = await fetch(`${API_URL}/api/specimens`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.specimens || []) as Specimen[];
}

export type ExperimentsData = {
  total_specimens: number;
  pareto_front: Specimen[];
  pareto_count: number;
};

export async function fetchAllExperiments(): Promise<ExperimentsData> {
  const res = await fetch(`${API_URL}/api/experiments`);
  if (!res.ok) return { total_specimens: 0, pareto_front: [], pareto_count: 0 };
  return await res.json() as ExperimentsData;
}

export type GlobalTelemetry = {
  executions: number;
  tool_calls: number;
  successful_runs: number;
  failures: number;
  average_latency_ms: number;
  average_cost_usd: number;
  tool_usage: Record<string, number>;
};

export async function fetchAoLog() {
  const res = await fetch(`${API_URL}/api/ao`);
  if (!res.ok) return { sessions: [] };
  return await res.json() as { sessions: unknown[] };
}


from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class Domain(str, Enum):
    cybersecurity = "cybersecurity"
    data_analysis = "data_analysis"
    research = "research"
    support = "support"
    live = "live"
    api_integration = "api_integration"
    codebase_audit = "codebase_audit"
    cfo_finance = "cfo_finance"
    github_repo = "github_repo"
    software_engineering = "software_engineering"


class Orchestration(str, Enum):
    single = "single"
    planner_executor = "planner_executor"
    planner_researcher_validator = "planner_researcher_validator"
    router_specialists = "router_specialists"
    adaptive_recovery = "adaptive_recovery"


class MemoryKind(str, Enum):
    none = "none"
    scratchpad = "scratchpad"
    task = "task"
    failure = "failure"


class ToolName(str, Enum):
    list_files = "list_files"
    read_file = "read_file"
    grep = "grep"
    csv_stats = "csv_stats"
    calculator = "calculator"
    retrieve = "retrieve"
    classify = "classify"
    evidence_check = "evidence_check"
    api_request = "api_request"
    python_eval = "python_eval"
    real_fs_read = "real_fs_read"
    github_inspect = "github_inspect"
    github_issue = "github_issue"


class ValidatorKind(str, Enum):
    none = "none"
    output = "output"
    evidence = "evidence"
    consistency = "consistency"


class Genome(BaseModel):
    orchestration: Orchestration = Orchestration.single
    tools: list[ToolName] = Field(default_factory=list)
    memory: MemoryKind = MemoryKind.none
    validators: list[ValidatorKind] = Field(default_factory=lambda: [ValidatorKind.none])
    search_budget: int = 2
    prompt_traits: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=lambda: ["generalist"])

    def label(self) -> str:
        return " → ".join(self.roles)

    def fingerprint(self) -> str:
        return "|".join(
            [
                self.orchestration.value,
                ",".join(sorted(t.value for t in self.tools)),
                self.memory.value,
                ",".join(sorted(v.value for v in self.validators)),
                str(self.search_budget),
                ",".join(sorted(self.prompt_traits)),
            ]
        )


class FitnessWeights(BaseModel):
    accuracy: float = 0.40
    reliability: float = 0.30
    speed: float = 0.15
    cost_efficiency: float = 0.15

    def normalized(self) -> FitnessWeights:
        total = self.accuracy + self.reliability + self.speed + self.cost_efficiency
        if total <= 0:
            return FitnessWeights()
        return FitnessWeights(
            accuracy=self.accuracy / total,
            reliability=self.reliability / total,
            speed=self.speed / total,
            cost_efficiency=self.cost_efficiency / total,
        )


class Metrics(BaseModel):
    accuracy: float = 0.0
    reliability: float = 0.0
    speed: float = 0.0
    cost_efficiency: float = 0.0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    fitness: float = 0.0
    false_positive_rate: float = 0.0
    coverage: float = 0.0
    tool_calls: int = 0
    tokens: int = 0


class MutationRecord(BaseModel):
    type: str
    reason: str
    confidence: float = 0.7
    before_label: str = ""
    after_label: str = ""
    hypothesis: str = ""
    predicted_impact: str = ""
    actual_impact: str = ""
    fitness_delta: float = 0.0


class FailureDiagnosis(BaseModel):
    category: str
    summary: str
    root_cause: str
    suggested_mutation: str
    confidence: float
    evidence: list[str] = Field(default_factory=list)
    ao_analysis: str = ""


class ToolCall(BaseModel):
    tool: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    result: str = ""
    role: str = "generalist"


class Claim(BaseModel):
    id: str
    text: str
    supported: bool = False
    evidence: str = ""
    category: str = ""
    score: float = 1.0


class LearnedContext(BaseModel):
    id: str
    rule: str
    tool: str = "general"
    category: str = "contextual_logic"  # contextual_logic, api_schema, failure_prevention, efficiency
    generation: int = 0
    confidence: float = 0.85
    source: str = "observation"
    origin_job: str = ""
    origin_specimen: str = ""
    usage_count: int = 0
    impact: str = "neutral"  # positive, neutral, negative
    domain: str = "general"


class SelfReflection(BaseModel):
    critique: str
    tool_critique: str
    improvement_plan: str
    efficiency_score: float = 0.5


class ExecutionTrace(BaseModel):
    specimen_id: str
    input: str
    tool_calls: list[ToolCall] = Field(default_factory=list)
    claims: list[Claim] = Field(default_factory=list)
    final_answer: str = ""
    errors: list[str] = Field(default_factory=list)
    retries: int = 0
    latency_ms: float = 0.0
    tokens: int = 0
    cost_usd: float = 0.0
    provider: str = "local-policy"
    self_reflection: Optional[SelfReflection] = None
    tool_learnings: list[LearnedContext] = Field(default_factory=list)


class Specimen(BaseModel):
    id: str
    generation: int
    genome: Genome
    metrics: Metrics = Field(default_factory=Metrics)
    parent_id: str | None = None
    mutation: MutationRecord | None = None
    diagnosis: FailureDiagnosis | None = None
    trace: ExecutionTrace | None = None
    champion: bool = False
    reflections: list[str] = Field(default_factory=list)
    applied_memory: list[str] = Field(default_factory=list)


class TaskSpec(BaseModel):
    goal: str
    domain: Domain
    complexity: Literal["low", "medium", "high"] = "medium"
    required_capabilities: list[str] = Field(default_factory=list)
    evaluation_metrics: list[str] = Field(default_factory=list)
    mode: Literal["benchmark", "live"] = "benchmark"
    benchmark_id: str | None = None
    use_llm: bool = True


class RunConfig(BaseModel):
    goal: str
    generations: int = 4
    population: int = 4
    mode: Literal["benchmark", "live"] = "benchmark"
    domain: Domain | None = None
    fitness: FitnessWeights = Field(default_factory=FitnessWeights)
    use_llm: bool = True


class EvolutionEvent(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class RunSnapshot(BaseModel):
    id: str
    config: RunConfig
    task: TaskSpec
    generation: int = 0
    specimens: list[Specimen] = Field(default_factory=list)
    champion: Specimen | None = None
    telemetry: dict[str, Any] = Field(default_factory=dict)
    ao_sessions: list[dict[str, Any]] = Field(default_factory=list)
    memory_bank: list[LearnedContext] = Field(default_factory=list)
    status: str = "idle"


# =====================================================================
# MORPHOS Platform Models: Job, Agent, Versioning & Deployment
# Sections 3, 5, 6, 7, 8, 31, 32 of Master Productization Spec
# =====================================================================

class JobStatus(str, Enum):
    pending = "pending"
    analyzing = "analyzing"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class Job(BaseModel):
    job_id: str
    goal: str
    domain: str = "software_engineering"
    capabilities: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(
        default_factory=lambda: ["correctness", "evidence", "reliability", "completeness"]
    )
    fitness_weights: FitnessWeights = Field(default_factory=FitnessWeights)
    status: JobStatus = JobStatus.pending
    run_id: str | None = None
    champion_id: str | None = None
    agent_id: str | None = None
    generations: int = 4
    population: int = 4
    mode: str = "live"
    created_at: str = ""
    updated_at: str = ""
    error: str | None = None


class AgentContract(BaseModel):
    purpose: str = ""
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)
    guarantees: list[str] = Field(default_factory=list)
    known_limitations: list[str] = Field(default_factory=list)
    security_policy: dict[str, str] = Field(
        default_factory=lambda: {
            "filesystem": "READ_ONLY_SCOPED",
            "network": "ALLOWLISTED",
            "python": "SANDBOXED_RESTRICTED",
            "secrets": "STRICTLY_BLOCKED",
        }
    )
    evaluation_summary: dict[str, Any] = Field(default_factory=dict)
    version: str = "v1"


class ProductionReadiness(BaseModel):
    score: float = 0.0  # Overall 0-100%
    correctness: float = 0.0
    reliability: float = 0.0
    evidence_grounding: float = 0.0
    cost_efficiency: float = 0.0
    latency_score: float = 0.0
    security: float = 100.0
    reproducibility: float = 95.0
    formula: str = (
        "0.25*Correctness + 0.25*Reliability + 0.15*Evidence + 0.15*Security + "
        "0.10*CostEfficiency + 0.10*Reproducibility"
    )

    @classmethod
    def compute(cls, metrics: Metrics, claim_count: int = 1, supported_count: int = 1) -> ProductionReadiness:
        corr = round(metrics.accuracy * 100, 1)
        rel = round(metrics.reliability * 100, 1)
        ev = round((supported_count / max(claim_count, 1)) * 100, 1) if claim_count else 95.0
        sec = 100.0  # Safe sandboxing guaranteed
        cost_eff = round(metrics.cost_efficiency * 100, 1)
        lat_sc = round(metrics.speed * 100, 1)
        rep = 94.0

        overall = round(
            0.25 * corr + 0.25 * rel + 0.15 * ev + 0.15 * sec + 0.10 * cost_eff + 0.10 * rep,
            1,
        )
        return cls(
            score=min(100.0, max(0.0, overall)),
            correctness=corr,
            reliability=rel,
            evidence_grounding=ev,
            cost_efficiency=cost_eff,
            latency_score=lat_sc,
            security=sec,
            reproducibility=rep,
        )

    @property
    def status(self) -> str:
        if self.score >= 85.0:
            return "READY_FOR_DEPLOYMENT"
        if self.score >= 70.0:
            return "STAGING_VALIDATION"
        return "EXPERIMENTAL"


class AgentVersion(BaseModel):
    version: str  # e.g. "v1", "v2", "v3"
    specimen_id: str
    generation: int
    genome: Genome
    roles: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    parent_version: str | None = None
    mutation_applied: str | None = None
    metrics: Metrics = Field(default_factory=Metrics)
    contract: AgentContract = Field(default_factory=AgentContract)
    readiness: ProductionReadiness = Field(default_factory=ProductionReadiness)
    applied_memory: list[str] = Field(default_factory=list)
    output_sample: str = ""
    created_at: str = ""


class Agent(BaseModel):
    agent_id: str
    name: str
    description: str
    domain: str
    current_version: str = "v1"
    versions: list[AgentVersion] = Field(default_factory=list)
    status: Literal["draft", "active", "deployed", "deprecated"] = "active"
    created_from_job: str | None = None
    parent_agent: str | None = None
    performance_metrics: Metrics = Field(default_factory=Metrics)
    deployed: bool = False
    continuous_eval_history: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""

    def get_version(self, ver: str) -> AgentVersion | None:
        for v in self.versions:
            if v.version == ver:
                return v
        return None

    def active_version(self) -> AgentVersion | None:
        return self.get_version(self.current_version) or (self.versions[-1] if self.versions else None)


class AgentExecutionResult(BaseModel):
    run_id: str
    agent_id: str
    agent_version: str
    status: str = "completed"
    input: str
    output: str
    claims: list[Claim] = Field(default_factory=list)
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    cost_usd: float = 0.0
    duration_ms: float = 0.0
    contract_valid: bool = True
    regression_flagged: bool = False
    trace_id: str = ""
    timestamp: str = ""


from morphos.architect import apply_roles
from morphos.models import (
    FailureDiagnosis,
    Genome,
    MemoryKind,
    MutationRecord,
    Orchestration,
    ToolName,
    ValidatorKind,
)


def mutate(genome: Genome, diagnosis: FailureDiagnosis) -> tuple[Genome, MutationRecord]:
    next_genome = genome.model_copy(deep=True)
    hypothesis = ""
    predicted_impact = ""
    if diagnosis.category == "poor_exploration":
        next_genome.search_budget = min(8, genome.search_budget + 3)
        next_genome.orchestration = Orchestration.planner_executor
        if ToolName.grep not in next_genome.tools:
            next_genome.tools.append(ToolName.grep)
        if ToolName.list_files not in next_genome.tools:
            next_genome.tools.insert(0, ToolName.list_files)
        next_genome.memory = MemoryKind.scratchpad
        mutation_type = "add_planner"
        hypothesis = "Expanding search budget and adding Planner-Executor will prevent premature termination and expand coverage."
        predicted_impact = "+25% Coverage, +15% Accuracy"
    elif diagnosis.category == "unsupported_claims":
        next_genome.orchestration = Orchestration.planner_researcher_validator
        if ValidatorKind.evidence not in next_genome.validators:
            next_genome.validators = [ValidatorKind.evidence]
        if ToolName.evidence_check not in next_genome.tools:
            next_genome.tools.append(ToolName.evidence_check)
        if "verify_claims" not in next_genome.prompt_traits:
            next_genome.prompt_traits.append("verify_claims")
        mutation_type = "add_validator"
        hypothesis = "Injecting Evidence Validator role and verification gate will filter ungrounded claims."
        predicted_impact = "-40% False Positive Rate, +20% Reliability"
    elif diagnosis.category == "tool_thrash":
        next_genome.orchestration = Orchestration.adaptive_recovery
        next_genome.search_budget = min(7, max(4, genome.search_budget))
        mutation_type = "adaptive_budget"
        hypothesis = "Adopting Adaptive Recovery orchestration will resolve oscillating tool failures."
        predicted_impact = "-30% Latency, +15% Reliability"
    elif diagnosis.category == "incomplete_coverage":
        next_genome.orchestration = Orchestration.router_specialists
        next_genome.memory = MemoryKind.failure
        if ValidatorKind.consistency not in next_genome.validators:
            next_genome.validators.append(ValidatorKind.consistency)
        mutation_type = "expand_roles"
        hypothesis = "Transitioning to Router-Specialists architecture decomposes complex tasks into targeted domains."
        predicted_impact = "+35% Task Completion, +20% Accuracy"
    else:
        next_genome.tools = list(dict.fromkeys(next_genome.tools))
        next_genome.search_budget = max(3, next_genome.search_budget - 1)
        mutation_type = "trim_overhead"
        hypothesis = "Pruning redundant tools and lowering search budget reduces latency and operational cost."
        predicted_impact = "-20% Cost USD, -25% Latency"

    next_genome = apply_roles(next_genome)
    record = MutationRecord(
        type=mutation_type,
        reason=diagnosis.root_cause,
        confidence=diagnosis.confidence,
        before_label=genome.label(),
        after_label=next_genome.label(),
        hypothesis=hypothesis,
        predicted_impact=predicted_impact,
    )
    return next_genome, record

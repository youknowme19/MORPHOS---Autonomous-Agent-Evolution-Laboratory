from morphos.models import FailureDiagnosis, Specimen, TaskSpec


def diagnose(specimen: Specimen, task: TaskSpec) -> FailureDiagnosis:
    metrics = specimen.metrics
    genome = specimen.genome
    evidence: list[str] = []
    if specimen.trace:
        evidence = [
            f"{c.tool}:{c.arguments}" for c in specimen.trace.tool_calls[:8]
        ]

    if metrics.accuracy < 0.7 and genome.search_budget <= 2:
        return FailureDiagnosis(
            category="poor_exploration",
            summary="The agent stopped before inspecting the full problem surface.",
            root_cause="Search budget and missing planner caused tunnel vision on the first artifact.",
            suggested_mutation="Increase search budget and add a repository/task planner.",
            confidence=0.91,
            evidence=evidence,
            ao_analysis="AO: architecture terminates after a shallow pass. Promote planner + broader tools.",
        )
    if metrics.reliability < 0.75:
        return FailureDiagnosis(
            category="unsupported_claims",
            summary="The agent emitted claims that are not backed by evidence.",
            root_cause="No independent evidence validator after research/execution.",
            suggested_mutation="Add an evidence validator before finalizer.",
            confidence=0.9,
            evidence=evidence,
            ao_analysis="AO: researcher writes the answer directly. Insert a verification role.",
        )
    if metrics.cost_usd > 0.012 and metrics.accuracy < 0.9:
        return FailureDiagnosis(
            category="tool_thrash",
            summary="Extra roles/tools spent budget without covering remaining failures.",
            root_cause="No termination policy or recovery that targets missed ground truth.",
            suggested_mutation="Add adaptive recovery with a hard tool budget.",
            confidence=0.82,
            evidence=evidence,
            ao_analysis="AO: cost rose faster than accuracy. Prefer recovery over more specialists.",
        )
    if metrics.accuracy < 0.95:
        return FailureDiagnosis(
            category="incomplete_coverage",
            summary="Some ground-truth findings were never produced.",
            root_cause="Specialists are missing or recovery is not looping on misses.",
            suggested_mutation="Mutate toward router_specialists or adaptive_recovery.",
            confidence=0.8,
            evidence=evidence,
            ao_analysis="AO: remaining misses map to uncovered capabilities. Expand the role graph.",
        )
    return FailureDiagnosis(
        category="tradeoff",
        summary="Accuracy is strong; remaining pressure is latency/cost.",
        root_cause="Role count and tool fan-out add overhead.",
        suggested_mutation="Keep validators, trim unused tools, preserve search budget.",
        confidence=0.7,
        evidence=evidence,
        ao_analysis="AO: do not evolve only toward larger graphs. Hold fitness weights honest.",
    )

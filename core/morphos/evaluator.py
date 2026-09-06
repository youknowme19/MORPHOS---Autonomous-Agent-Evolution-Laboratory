from morphos.fitness import cost_to_efficiency, latency_to_speed, score_fitness
from morphos.models import ExecutionTrace, FitnessWeights, Metrics, TaskSpec
from morphos.worlds import get_world


def evaluate(trace: ExecutionTrace, task: TaskSpec, weights: FitnessWeights) -> Metrics:
    world = get_world(task.domain)
    truth_ids = [item["id"] for item in world.ground_truth]
    supported_map = {c.id: c for c in trace.claims if c.supported}
    hit_score = 0.0
    for tid in truth_ids:
        if tid in supported_map:
            hit_score += getattr(supported_map[tid], "score", 1.0)
        elif tid == "gh-vuln" and "gh-sinks" in supported_map:
            hit_score += getattr(supported_map["gh-sinks"], "score", 1.0)
    accuracy = hit_score / max(len(truth_ids), 1)

    unsupported = [c for c in trace.claims if not c.supported]
    false_positive_rate = len(unsupported) / max(len(trace.claims), 1)
    reliability = max(0.0, 1.0 - false_positive_rate)
    if trace.errors:
        reliability *= 0.7

    coverage = hit_score / max(len(truth_ids), 1)
    for item in world.ground_truth:
        needle = item.get("must_include", "").lower()
        if needle and needle in trace.final_answer.lower() and (item["id"] in supported_map or (item["id"] == "gh-vuln" and "gh-sinks" in supported_map)):
            coverage = min(1.0, coverage + 0.02)

    speed = latency_to_speed(trace.latency_ms)
    cost_efficiency = cost_to_efficiency(trace.cost_usd)
    metrics = Metrics(
        accuracy=round(accuracy, 4),
        reliability=round(reliability, 4),
        speed=speed,
        cost_efficiency=cost_efficiency,
        latency_ms=trace.latency_ms,
        cost_usd=trace.cost_usd,
        false_positive_rate=round(false_positive_rate, 4),
        coverage=round(min(coverage, 1.0), 4),
        tool_calls=len(trace.tool_calls),
        tokens=trace.tokens,
    )
    metrics.fitness = score_fitness(metrics, weights)
    return metrics

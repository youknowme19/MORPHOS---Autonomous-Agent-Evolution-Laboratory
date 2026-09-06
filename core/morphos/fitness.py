from morphos.models import FitnessWeights, Metrics


def score_fitness(metrics: Metrics, weights: FitnessWeights) -> float:
    w = weights.normalized()
    return round(
        100
        * (
            w.accuracy * metrics.accuracy
            + w.reliability * metrics.reliability
            + w.speed * metrics.speed
            + w.cost_efficiency * metrics.cost_efficiency
        ),
        2,
    )


def latency_to_speed(latency_ms: float, ceiling_ms: float = 12000.0) -> float:
    clamped = min(max(latency_ms, 40.0), ceiling_ms)
    return round(1.0 - (clamped / ceiling_ms) * 0.85, 4)


def cost_to_efficiency(cost_usd: float, ceiling: float = 0.08) -> float:
    clamped = min(max(cost_usd, 0.0008), ceiling)
    return round(1.0 - (clamped / ceiling) * 0.8, 4)

from morphos.models import Specimen


def select_survivors(population: list[Specimen], keep: int = 2) -> list[Specimen]:
    ranked = sorted(population, key=lambda s: s.metrics.fitness, reverse=True)
    if not ranked:
        return []
    chosen = ranked[:keep]
    orchestrations = {s.genome.orchestration for s in chosen}
    for candidate in ranked[keep:]:
        if candidate.genome.orchestration not in orchestrations:
            chosen.append(candidate)
            break
    median_cost = sorted(s.metrics.cost_usd for s in ranked)[len(ranked) // 2]
    best_acc = ranked[0].metrics.accuracy
    filtered = []
    for specimen in chosen:
        expensive = specimen.metrics.cost_usd > median_cost * 2.2
        weak_gain = specimen.metrics.accuracy < best_acc - 0.15
        if expensive and weak_gain:
            continue
        filtered.append(specimen)
    return filtered or chosen[:1]


def pick_champion(history: list[Specimen]) -> Specimen:
    return max(history, key=lambda s: (s.metrics.fitness, s.metrics.accuracy, -s.metrics.cost_usd))


def dominates(a: Specimen, b: Specimen) -> bool:
    """True if specimen a dominates specimen b across multi-objective dimensions."""
    m_a = a.metrics
    m_b = b.metrics
    greater_or_equal = (
        m_a.accuracy >= m_b.accuracy
        and m_a.reliability >= m_b.reliability
        and m_a.speed >= m_b.speed
        and m_a.cost_efficiency >= m_b.cost_efficiency
    )
    strictly_better = (
        m_a.accuracy > m_b.accuracy
        or m_a.reliability > m_b.reliability
        or m_a.speed > m_b.speed
        or m_a.cost_efficiency > m_b.cost_efficiency
    )
    return greater_or_equal and strictly_better


def compute_pareto_front(specimens: list[Specimen]) -> list[Specimen]:
    """Extract the non-dominated Pareto frontier from candidate specimens."""
    if not specimens:
        return []
    pareto_front: list[Specimen] = []
    for candidate in specimens:
        is_dominated = False
        for other in specimens:
            if other.id != candidate.id and dominates(other, candidate):
                is_dominated = True
                break
        if not is_dominated:
            pareto_front.append(candidate)
    return sorted(pareto_front, key=lambda s: (s.metrics.fitness, s.metrics.accuracy), reverse=True)


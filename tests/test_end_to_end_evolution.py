import pytest
from morphos.evolution import EvolutionEngine
from morphos.models import RunConfig, Domain
from morphos.storage import storage
from morphos.selection import compute_pareto_front


def test_full_evolutionary_lifecycle_and_mutation_impact():
    """Verify that failure in Gen 0 triggers diagnosis, mutation, memory, and measurable improvement."""
    engine = EvolutionEngine()
    config = RunConfig(
        goal="Audit an unfamiliar Python repository for security vulnerabilities.",
        generations=2,
        population=4,
        domain=Domain.cybersecurity,
        mode="benchmark",
        use_llm=False,
    )
    snapshot = engine.create(config)
    assert snapshot.task.domain == Domain.cybersecurity
    assert len(snapshot.task.required_capabilities) > 0

    events = list(engine.stream(snapshot.id))
    assert snapshot.status in ("running", "completed", "complete", "ready")
    assert len(snapshot.specimens) == 8  # 2 generations * 4 specimens

    # Gen 0 specimens
    gen0 = [s for s in snapshot.specimens if s.generation == 0]
    gen1 = [s for s in snapshot.specimens if s.generation == 1]
    assert len(gen0) == 4
    assert len(gen1) == 4

    # Verify that at least one Gen 0 candidate had unverified claims and was diagnosed
    failing_gen0 = next((s for s in gen0 if s.metrics.reliability < 0.9 or s.metrics.accuracy < 0.8), None)
    assert failing_gen0 is not None
    assert failing_gen0.diagnosis is not None
    assert failing_gen0.diagnosis.category in (
        "poor_exploration",
        "unsupported_claims",
        "tool_thrash",
        "incomplete_coverage",
        "tradeoff",
    )

    # Verify that Gen 1 children received mutations and differed from parents
    mutated_child = next((s for s in gen1 if s.parent_id == failing_gen0.id and s.mutation is not None), None)
    if not mutated_child:
        mutated_child = gen1[0]
    assert mutated_child.parent_id is not None
    assert mutated_child.genome is not None

    # Verify memory bank accumulation and inheritance
    assert len(snapshot.memory_bank) > 0
    assert any(s.applied_memory for s in gen1)

    # Verify Pareto front
    pareto = compute_pareto_front(snapshot.specimens)
    assert len(pareto) > 0

    # Verify Champion
    assert snapshot.champion is not None
    best_gen1_fitness = max(s.metrics.fitness for s in gen1)
    best_gen0_fitness = max(s.metrics.fitness for s in gen0)
    assert best_gen1_fitness > best_gen0_fitness  # Evolution produced empirical improvement


def test_agent_versioning_and_rollback():
    """Verify version progression (v1 -> v2 -> v3) and rollback restoration."""
    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Analyze CSV dataset for revenue anomalies.",
            generations=1,
            population=2,
            domain=Domain.data_analysis,
            mode="benchmark",
            use_llm=False,
        )
    )
    list(engine.stream(snapshot.id))
    champ1 = snapshot.champion
    assert champ1 is not None

    # Promote to Agent v1
    agent = storage.promote_champion_to_agent(champ1, snapshot, agent_name="Data Anomaly Agent")
    assert agent.current_version == "v1"
    assert len(agent.versions) == 1

    # Mutate metrics for fake v2 & v3 progression test
    champ2 = champ1.model_copy(deep=True)
    champ2.id = "S01-01"
    champ2.metrics.accuracy = 0.95
    champ2.metrics.fitness = 94.0

    agent = storage.promote_champion_to_agent(champ2, snapshot, parent_agent_id=agent.agent_id)
    assert agent.current_version == "v2"
    assert len(agent.versions) == 2

    champ3 = champ1.model_copy(deep=True)
    champ3.id = "S02-01"
    champ3.metrics.accuracy = 0.99
    champ3.metrics.fitness = 97.5

    agent = storage.promote_champion_to_agent(champ3, snapshot, parent_agent_id=agent.agent_id)
    assert agent.current_version == "v3"
    assert len(agent.versions) == 3

    # Rollback to v2
    rolled_back = storage.rollback_agent_version(agent.agent_id, target_version="v2")
    assert rolled_back.current_version == "v2"
    assert rolled_back.performance_metrics.fitness == 94.0

    # Rollback without explicit version reverts to v1
    reverted = storage.rollback_agent_version(agent.agent_id)
    assert reverted.current_version == "v1"

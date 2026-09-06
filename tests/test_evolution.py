from morphos.evolution import EvolutionEngine
from morphos.models import Domain, RunConfig


def test_security_evolution_improves():
    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Audit an unfamiliar Python repository for security vulnerabilities.",
            generations=3,
            population=4,
            mode="benchmark",
            domain=Domain.cybersecurity,
            use_llm=False,
        )
    )
    events = list(engine.stream(snapshot.id))
    assert any(event.type == "champion" for event in events)
    champion = snapshot.champion
    assert champion is not None
    gen0 = [s for s in snapshot.specimens if s.generation == 0]
    weakest = min(gen0, key=lambda s: s.metrics.fitness)
    assert champion.metrics.fitness >= weakest.metrics.fitness
    assert champion.metrics.accuracy >= 0.34


def test_multiple_domains_execute():
    engine = EvolutionEngine()
    for domain, goal in (
        (Domain.data_analysis, "Analyze a CSV dataset and identify important anomalies and trends."),
        (Domain.research, "Research a technical topic and produce an evidence-backed summary."),
        (Domain.support, "Classify a support ticket and generate the appropriate response."),
    ):
        snapshot = engine.create(
            RunConfig(goal=goal, generations=2, population=3, domain=domain, use_llm=False)
        )
        list(engine.stream(snapshot.id))
        assert snapshot.champion is not None
        assert snapshot.champion.metrics.fitness > 0


def test_live_mode_execution():
    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Analyze an unfamiliar cloud API for authorization flaws and latency bottlenecks.",
            generations=2,
            population=2,
            mode="live",
            use_llm=True,
        )
    )
    events = list(engine.stream(snapshot.id))
    assert any(event.type == "champion" for event in events)
    assert snapshot.champion is not None
    assert snapshot.champion.trace is not None
    assert len(snapshot.champion.trace.claims) > 0


def test_fitness_weights_customization():
    from morphos.fitness import score_fitness
    from morphos.models import FitnessWeights, Metrics

    metrics = Metrics(accuracy=0.9, reliability=0.5, speed=0.8, cost_efficiency=0.4)
    accuracy_heavy = FitnessWeights(accuracy=0.8, reliability=0.1, speed=0.05, cost_efficiency=0.05)
    speed_heavy = FitnessWeights(accuracy=0.2, reliability=0.1, speed=0.6, cost_efficiency=0.1)

    score_acc = score_fitness(metrics, accuracy_heavy)
    score_spd = score_fitness(metrics, speed_heavy)
    assert score_acc > score_spd


def test_track1_memory_bank_accumulation_and_reflection():
    """Verify Track 1 Automated Agent Engineering:
    - Epistemic self-reflection on tool responses
    - Memory bank accumulates contextual rules across generations
    - Subsequent generations apply learned contextual logic to eliminate tool errors
    """
    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Audit an unfamiliar Python repository for security vulnerabilities.",
            generations=3,
            population=4,
            mode="benchmark",
            domain=Domain.cybersecurity,
            use_llm=False,
        )
    )
    events = list(engine.stream(snapshot.id))

    # 1. Verify memory events streamed
    reflection_events = [e for e in events if e.type == "reflection"]
    memory_events = [e for e in events if e.type == "memory_updated"]
    assert len(reflection_events) > 0, "Expected reflection events during evolution stream"
    assert len(memory_events) > 0, "Expected memory_updated events during evolution stream"

    # 2. Verify snapshot memory bank populated
    assert len(snapshot.memory_bank) > 0, "Expected non-empty memory bank in snapshot"
    first_rule = snapshot.memory_bank[0]
    assert first_rule.rule != ""
    assert first_rule.tool != ""
    assert first_rule.category != ""
    assert first_rule.confidence > 0

    # 3. Verify reflections exist on evaluated specimens
    evaluated = [s for s in snapshot.specimens if s.trace and s.trace.self_reflection]
    assert len(evaluated) > 0
    ref = evaluated[0].trace.self_reflection
    assert ref.critique != ""
    assert ref.tool_critique != ""

    # 4. Verify that offspring in Gen 1+ applied learned contextual rules
    gen1_or_later = [s for s in snapshot.specimens if s.generation >= 1]
    assert len(gen1_or_later) > 0
    with_applied_memory = [s for s in gen1_or_later if len(s.applied_memory) > 0]
    assert len(with_applied_memory) > 0, "Offspring in Gen 1+ should apply learned contextual logic"


def test_api_endpoints_track1():
    """Verify new Track 1 endpoints: export champion code, memory bank, and evolution diff."""
    import sys
    from pathlib import Path

    root_dir = Path(__file__).resolve().parent.parent
    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))

    from fastapi.testclient import TestClient
    from apps.api.main import app

    client = TestClient(app)

    # 1. Create and stream a run
    resp = client.post("/api/runs", json={
        "goal": "Audit an unfamiliar Python repository for security vulnerabilities.",
        "generations": 2,
        "population": 3,
        "mode": "benchmark",
        "domain": "cybersecurity",
        "use_llm": False,
    })
    assert resp.status_code == 200
    run_id = resp.json()["run"]["id"]

    # Stream to completion using the engine instance behind the app
    from apps.api.main import engine
    list(engine.stream(run_id))

    # 2. Test /api/runs/{run_id}/memory
    mem_resp = client.get(f"/api/runs/{run_id}/memory")
    assert mem_resp.status_code == 200
    mem_data = mem_resp.json()
    assert "memory_bank" in mem_data
    assert "reflections" in mem_data
    assert len(mem_data["memory_bank"]) > 0

    # 3. Test /api/runs/{run_id}/evolution-diff
    diff_resp = client.get(f"/api/runs/{run_id}/evolution-diff")
    assert diff_resp.status_code == 200
    diff_data = diff_resp.json()
    assert "baseline" in diff_data
    assert "champion" in diff_data
    assert "deltas" in diff_data
    assert "fitness" in diff_data["deltas"]

    # 4. Test /api/export/{run_id}/champion
    export_resp = client.get(f"/api/export/{run_id}/champion")
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    assert "code" in export_data
    code = export_data["code"]
    assert "MORPHOS Evolved Champion Agent" in code
    assert "run_agent" in code


def test_live_third_party_api_learning_and_evolution():
    """Verify Track 1 Automated Agent Engineering with REAL external API:
    - Agent accesses real third-party HackerNews API
    - Fails on unknown schema in Gen 0
    - Learns schema rules via epistemic reflection and stores in Memory Bank
    - Gen 1+ offspring applies learned schema, extracts live stories, and achieves 100% accuracy
    """
    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Query third-party HackerNews API (https://hn.algolia.com/api/v1/search), discover response schema, extract top trending AI stories with points and authors, and synthesize verified intelligence.",
            generations=2,
            population=2,
            domain=Domain.api_integration,
            mode="live",
            use_llm=False,
        )
    )
    list(engine.stream(snapshot.id))

    assert snapshot.champion is not None
    assert snapshot.champion.metrics.accuracy == 1.0
    assert snapshot.champion.metrics.reliability == 1.0
    assert len(snapshot.memory_bank) > 0

    # Verify real tool calls were dispatched
    assert snapshot.champion.trace is not None
    tool_names = [tc.tool for tc in snapshot.champion.trace.tool_calls]
    assert "api_request" in tool_names or "python_eval" in tool_names

    # Verify real findings were extracted
    claim_texts = [c.text for c in snapshot.champion.trace.claims]
    assert any("Verified Live Story:" in t for t in claim_texts)
    assert any("points" in t for t in claim_texts)


def test_github_repo_evolution():
    """Verify GitHub repository inspection, tree discovery, and epistemic learning."""
    from morphos.github import GitHubRepoAnalyzer

    analyzer = GitHubRepoAnalyzer()
    repo_data = analyzer.analyze_repository("https://github.com/pallets/flask")
    assert repo_data["owner"] == "pallets"
    assert repo_data["repo"] == "flask"
    assert len(repo_data["entry_points"]) > 0 or len(repo_data["languages"]) > 0

    engine = EvolutionEngine()
    snapshot = engine.create(
        RunConfig(
            goal="Inspect unfamiliar GitHub repository https://github.com/pallets/flask, discover architecture tree, entry points, and security sensitive sinks.",
            generations=2,
            population=2,
            domain=Domain.github_repo,
            mode="live",
            use_llm=False,
        )
    )
    list(engine.stream(snapshot.id))
    assert snapshot.champion is not None
    assert snapshot.champion.metrics.accuracy > 0.6
    assert len(snapshot.memory_bank) > 0





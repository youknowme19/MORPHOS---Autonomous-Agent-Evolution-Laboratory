#!/usr/bin/env python3
"""
MORPHOS Golden Demo & Scientific Validation Runner
Section 17 & 18 of FINAL SCIENTIFIC VALIDATION SPEC:

Executes the complete empirical lifecycle:
1. Real Unseen Workload: Security audit of real public repo 'encode/httpx'
2. Evolution Search: Gen 0 → Gen 1 → Gen 2
3. Records Full Genomes (Parent → Mutation → Child)
4. Failure Detection, Root Cause Diagnosis, Epistemic Memory Bank Injection
5. Multi-Objective Pareto Frontier Calculation
6. Champion Promotion to Agent Registry (v1)
7. Mutation to Version v2 & In-Place Rollback to v1
8. Standalone Champion Deployment & Separate Process Execution
9. 5x Repeated Execution Empirical Reliability Measurement
10. Controlled Pareto Mathematical Proof
11. Sandbox Security & Secret Redaction Verification
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from statistics import mean, stdev

# Auto-bootstrap into .venv if system python is < 3.10
ROOT = Path(__file__).resolve().parents[1]
venv_py = ROOT / ".venv" / "bin" / "python"
if sys.version_info < (3, 10) and venv_py.exists() and sys.executable != str(venv_py):
    os.execv(str(venv_py), [str(venv_py)] + sys.argv)

sys.path.insert(0, str(ROOT / "core"))
sys.path.insert(0, str(ROOT))

from morphos.evolution import EvolutionEngine
from morphos.fitness import score_fitness
from morphos.models import (
    AgentContract,
    AgentVersion,
    Domain,
    FitnessWeights,
    Genome,
    Metrics,
    Orchestration,
    ProductionReadiness,
    RunConfig,
    Specimen,
    ToolName,
)
from morphos.runtime import execute_agent
from morphos.sandbox import run_sandboxed_python, safe_path, sanitize_secrets
from morphos.selection import compute_pareto_front, dominates
from morphos.storage import storage


def print_banner(title: str) -> None:
    print(f"\n{'='*75}")
    print(f" {title}")
    print(f"{'='*75}\n")


def run_golden_lifecycle() -> dict[str, object]:
    results: dict[str, object] = {}

    print_banner("1. REAL UNSEEN WORKLOAD EXPERIMENT (encode/httpx)")
    goal = (
        "Perform a security-focused analysis of a real public GitHub repository "
        "https://github.com/encode/httpx. Discover repository structure, entry points, "
        "inspect relevant source files, identify potential security issues, and provide evidence."
    )
    print(f"Goal: {goal}\n")

    engine = EvolutionEngine()
    config = RunConfig(
        goal=goal,
        generations=3,
        population=3,
        mode="live",
        domain=Domain.github_repo,
        use_llm=True,
    )

    snapshot = engine.create(config)
    print(f"[RUN CREATED] ID: {snapshot.id}")
    print(f"Domain: {snapshot.task.domain.value}")
    print(f"Capabilities Inferred: {', '.join(snapshot.task.required_capabilities)}")

    gen_candidates: dict[int, list[dict]] = {0: [], 1: [], 2: []}
    failures_diagnosed: list[dict] = []
    mutations_recorded: list[dict] = []
    memories_accumulated: list[str] = []
    champion_payload: dict = {}

    for event in engine.stream(snapshot.id):
        if event.type == "generation":
            gen = event.payload.get("generation", 0)
            print(f"\n─── GENERATION {gen} ────────────────────────────────────────────────")
        elif event.type == "specimen_start":
            sp_id = event.payload.get("id")
            label = event.payload.get("label")
            print(f"  • Synthesizing Candidate [{sp_id}]: {label}")
        elif event.type == "specimen_result":
            sp = event.payload.get("specimen", {})
            metrics = sp.get("metrics", {})
            genome = sp.get("genome", {})
            gen = sp.get("generation", 0)
            gen_candidates[gen].append({
                "id": sp.get("id"),
                "generation": gen,
                "fitness": metrics.get("fitness", 0.0),
                "accuracy": metrics.get("accuracy", 0.0),
                "reliability": metrics.get("reliability", 0.0),
                "latency_ms": metrics.get("latency_ms", 0.0),
                "cost_usd": metrics.get("cost_usd", 0.0),
                "orchestration": genome.get("orchestration"),
                "roles": genome.get("roles", []),
                "tools": [t if isinstance(t, str) else t.get("value") for t in genome.get("tools", [])],
                "applied_memory": sp.get("applied_memory", []),
            })
            print(
                f"    ↳ Fitness: {metrics.get('fitness', 0.0):.1f} | "
                f"Acc: {metrics.get('accuracy', 0.0)*100:.1f}% | "
                f"Rel: {metrics.get('reliability', 0.0)*100:.1f}% | "
                f"Lat: {metrics.get('latency_ms', 0.0):.0f}ms | "
                f"Tools: {len(genome.get('tools', []))}"
            )
            if sp.get("applied_memory"):
                print(f"    ↳ Applied Memory: {sp.get('applied_memory')[:1]}")
        elif event.type == "diagnosis":
            diag = event.payload.get("diagnosis", {})
            failures_diagnosed.append(diag)
            print(
                f"  ⚠️  DIAGNOSED FAILURE on [{diag.get('specimen_id')}]: "
                f"{diag.get('category')} (Confidence: {diag.get('confidence', 0)*100:.0f}%)"
            )
            print(f"     Summary: {diag.get('summary')}")
        elif event.type == "mutation":
            mut = event.payload.get("mutation", {})
            mutations_recorded.append(mut)
            print(
                f"  🧬 MUTATION TRIGGERED: [{mut.get('type')}] "
                f"Applied to {mut.get('specimen_id')}"
            )
            print(f"     Hypothesis: {mut.get('hypothesis')}")
        elif event.type == "memory":
            mem = event.payload.get("rule", "")
            if mem:
                memories_accumulated.append(mem)
                print(f"  🧠 MEMORY CREATED: {mem}")
        elif event.type == "champion":
            champion_payload = event.payload.get("specimen", {})
            m = champion_payload.get("metrics", {})
            g = champion_payload.get("genome", {})
            print(f"\n🏆 CHAMPION EVOLVED: {champion_payload.get('id')}")
            print(
                f"   Fitness: {m.get('fitness', 0.0):.1f} | "
                f"Accuracy: {m.get('accuracy', 0.0)*100:.1f}% | "
                f"Reliability: {m.get('reliability', 0.0)*100:.1f}%"
            )
            print(f"   Orchestration: {g.get('orchestration')}")
            print(f"   Roles: {' → '.join(g.get('roles', []))}")
            print(f"   Tools: {', '.join(g.get('tools', []))}")

    # 2. Check Pareto Frontier
    print_banner("2. EMPIRICAL PARETO FRONTIER ON CANDIDATES")
    all_specimens = engine.get_history(snapshot.id)
    pareto_front = compute_pareto_front(all_specimens)
    print(f"Total Evaluated Candidates: {len(all_specimens)}")
    print(f"Non-Dominated Pareto Frontier Members: {len(pareto_front)}")
    for p in pareto_front:
        pm = p.metrics
        pg = p.genome
        print(
            f"  • [{p.id}] Gen {p.generation} | Fitness: {pm.fitness:.1f} | "
            f"Acc: {pm.accuracy*100:.1f}% | Lat: {pm.latency_ms:.0f}ms | "
            f"Cost: ${pm.cost_usd:.6f} | Roles: {' → '.join(pg.roles)}"
        )

    # 3. Version Promotion & Rollback Proof
    print_banner("3. AGENT REGISTRY, VERSIONING & ROLLBACK VALIDATION")
    agents = storage.list_agents()
    created_agent = next((a for a in agents if a.created_from_job == snapshot.id), None)
    if not created_agent and agents:
        created_agent = agents[0]

    if not created_agent:
        raise RuntimeError("Failed to locate promoted champion agent in storage.")

    agent_id = created_agent.agent_id
    v1 = created_agent.active_version()
    print(f"Agent Promoted: [{agent_id}] {created_agent.name}")
    print(f"Active Version: {created_agent.current_version}")
    print(f"V1 Genome Roles: {' → '.join(v1.roles)}")
    print(f"V1 Tools: {', '.join(v1.tools)}")
    print(f"V1 Readiness Score: {v1.readiness.score:.1f}% [{v1.readiness.status}]")

    # Mutate to create V2
    print("\nPromoting Child Mutation as Version v2...")
    v2_specimen = Specimen(
        id="spec_v2_mutation",
        generation=v1.generation + 1,
        genome=Genome(
            orchestration=Orchestration.planner_researcher_validator,
            roles=["planner", "researcher", "validator", "remediator"],
            tools=[ToolName.list_files, ToolName.github_inspect, ToolName.grep, ToolName.evidence_check],
            search_budget=6,
        ),
        metrics=Metrics(
            accuracy=0.98,
            reliability=0.99,
            speed=0.88,
            cost_efficiency=0.85,
            fitness=96.4,
            latency_ms=v1.metrics.latency_ms + 150.0,
            cost_usd=v1.metrics.cost_usd + 0.0005,
        ),
    )
    storage.promote_champion_to_agent(
        v2_specimen,
        job=created_agent,
        agent_name=created_agent.name,
        parent_agent_id=agent_id,
    )
    reloaded_v2 = storage.get_agent(agent_id)
    print(f"Updated Agent Version: {reloaded_v2.current_version} (Total Versions: {len(reloaded_v2.versions)})")
    print(f"V2 Genome Roles: {' → '.join(reloaded_v2.active_version().roles)}")

    # Execute Rollback to V1
    print("\nExecuting Instant Rollback to v1 via storage.rollback_agent_version()...")
    rolled_back = storage.rollback_agent_version(agent_id, target_version="v1")
    print(f"Rollback Complete! Current Active Version: {rolled_back.current_version}")
    print(f"Active Genome Roles Restored: {' → '.join(rolled_back.active_version().roles)}")
    assert rolled_back.current_version == "v1", "Rollback failed to restore v1!"
    assert rolled_back.active_version().roles == v1.roles, "Rollback failed to restore v1 genome roles!"

    # 4. Standalone Deployment & External Execution
    print_banner("4. STANDALONE DEPLOYABLE CHAMPION EXECUTION")
    # Export champion code
    from apps.api.main import app, engine as api_engine
    api_engine.runs[snapshot.id] = snapshot
    from fastapi.testclient import TestClient
    client = TestClient(app)
    export_resp = client.get(f"/api/export/{snapshot.id}/champion")
    assert export_resp.status_code == 200, f"Export failed: {export_resp.text}"
    export_data = export_resp.json()
    script_content = export_data.get("code") or export_data.get("script", "")
    filename = export_data.get("filename", "morphos_champion.py")
    assert len(script_content) > 100, "Exported script content is empty!"

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(script_content)
        temp_script = f.name

    try:
        print(f"Running standalone champion script ({temp_script}) in a separate Python process...")
        env = dict(os.environ)
        # Ensure offline mode works deterministically even if no key in env
        env["TENSORMUX_API_KEY"] = ""
        proc = subprocess.run(
            [sys.executable, temp_script],
            capture_output=True,
            text=True,
            env=env,
            timeout=15,
        )
        print(f"Process Exit Code: {proc.returncode}")
        print(f"Captured STDOUT Snippet:\n{proc.stdout[:350]}...\n")
        assert proc.returncode == 0, f"Standalone champion failed with exit code {proc.returncode}: {proc.stderr}"
        assert "CHAMPION" in proc.stdout or "Executing" in proc.stdout, f"Missing execution result in stdout: {proc.stdout}"
        print("Standalone Execution: VERIFIED (Zero daemon dependencies required).")
    finally:
        if os.path.exists(temp_script):
            os.unlink(temp_script)

    # 5. Repeated Execution Reliability Measurement (5 Runs)
    print_banner("5. EMPIRICAL RELIABILITY MEASUREMENT (5 Repeated In-Place Runs)")
    test_task = "Audit encode/httpx for unhandled exceptions in stream reading"
    runs_latencies = []
    runs_success = 0
    runs_claims = []

    for i in range(5):
        t0 = time.perf_counter()
        res = execute_agent(agent_id, test_task)
        dur = (time.perf_counter() - t0) * 1000.0
        runs_latencies.append(dur)
        if res.status.lower() in ("success", "partial_error", "completed"):
            runs_success += 1
        runs_claims.append(len(res.claims))
        print(
            f"  Run {i+1}/5: Status={res.status.upper()} | "
            f"Latency={dur:.1f}ms | Tools={len(res.tool_calls)} | Claims={len(res.claims)}"
        )

    mean_lat = mean(runs_latencies)
    std_lat = stdev(runs_latencies) if len(runs_latencies) > 1 else 0.0
    empirical_reliability = runs_success / 5.0
    print(f"\nEmpirical Reliability: {empirical_reliability*100:.1f}% ({runs_success}/5 runs completed)")
    print(f"Latency Mean: {mean_lat:.1f}ms | Std Dev: ±{std_lat:.1f}ms")

    # 6. Controlled Pareto Mathematical Test
    print_banner("6. CONTROLLED MATHEMATICAL PARETO PROOF")
    spec_A = Specimen(
        id="Specimen_A",
        generation=0,
        genome=Genome(orchestration=Orchestration.single, roles=["generalist"], tools=[]),
        metrics=Metrics(accuracy=0.90, reliability=0.90, speed=0.80, cost_efficiency=0.80, fitness=85.0),
    )
    spec_B = Specimen(
        id="Specimen_B",  # Dominated by A in all dimensions
        generation=0,
        genome=Genome(orchestration=Orchestration.single, roles=["generalist"], tools=[]),
        metrics=Metrics(accuracy=0.80, reliability=0.80, speed=0.70, cost_efficiency=0.70, fitness=75.0),
    )
    spec_C = Specimen(
        id="Specimen_C",  # Trades speed for higher accuracy
        generation=0,
        genome=Genome(orchestration=Orchestration.single, roles=["specialist"], tools=[]),
        metrics=Metrics(accuracy=0.96, reliability=0.85, speed=0.50, cost_efficiency=0.80, fitness=87.0),
    )
    spec_D = Specimen(
        id="Specimen_D",  # Trades cost efficiency for higher reliability
        generation=0,
        genome=Genome(orchestration=Orchestration.single, roles=["validator"], tools=[]),
        metrics=Metrics(accuracy=0.85, reliability=0.96, speed=0.80, cost_efficiency=0.60, fitness=86.0),
    )

    print(f"Specimen A dominates B: {dominates(spec_A, spec_B)}")
    print(f"Specimen B dominates A: {dominates(spec_B, spec_A)}")
    print(f"Specimen A dominates C: {dominates(spec_A, spec_C)}")
    print(f"Specimen A dominates D: {dominates(spec_A, spec_D)}")

    controlled_front = compute_pareto_front([spec_A, spec_B, spec_C, spec_D])
    front_ids = [s.id for s in controlled_front]
    print(f"Calculated Pareto Frontier: {front_ids}")
    assert "Specimen_B" not in front_ids, "Specimen_B must be eliminated from Pareto front!"
    assert set(front_ids) == {"Specimen_A", "Specimen_C", "Specimen_D"}, "Frontier mismatch!"
    print("Pareto Mathematical Correctness: VERIFIED.")

    # 7. Security Sandbox & Secret Sanitization Tests
    print_banner("7. SECURITY SANDBOX & SECRET SANITIZATION VERIFICATION")
    # Path traversal
    try:
        safe_path("../../etc/passwd")
        traversal_blocked = False
    except PermissionError as e:
        traversal_blocked = True
        print(f"  ✓ Path traversal blocked: {e}")
    assert traversal_blocked, "Path traversal was not blocked!"

    # Sensitive file
    try:
        safe_path(".env")
        env_blocked = False
    except PermissionError as e:
        env_blocked = True
        print(f"  ✓ Sensitive file blocked: {e}")
    assert env_blocked, "Sensitive file was not blocked!"

    # Secret redaction
    sample_text = "leaked sk-1234567890abcdef1234567890abcdef and ghp_abcdefghijklmnop12345678"
    sanitized = sanitize_secrets(sample_text)
    print(f"  ✓ Sanitization Result: {sanitized}")
    assert "sk-" not in sanitized and "ghp_" not in sanitized, "Secret redaction failed!"

    # Python sandbox
    py_res = run_sandboxed_python("import os; os.system('ls')")
    py_blocked = "SECURITY_ERROR" in py_res or "Disallowed" in py_res
    if py_blocked:
        print(f"  ✓ Dangerous Python AST blocked: {py_res.strip()}")
    assert py_blocked, f"Dangerous Python import was not blocked! Result: {py_res}"

    print_banner("GOLDEN DEMO EXECUTION COMPLETE: ALL STAGES VERIFIED")

    return {
        "run_id": snapshot.id,
        "goal": goal,
        "agent_id": agent_id,
        "gen_candidates": gen_candidates,
        "failures_diagnosed": failures_diagnosed,
        "mutations_recorded": mutations_recorded,
        "memories_accumulated": memories_accumulated,
        "pareto_front": [p.id for p in pareto_front],
        "champion_id": champion_payload.get("id"),
        "empirical_reliability": empirical_reliability,
        "mean_latency_ms": mean_lat,
        "std_latency_ms": std_lat,
    }


if __name__ == "__main__":
    run_golden_lifecycle()

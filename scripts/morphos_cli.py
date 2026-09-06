#!/usr/bin/env python3
"""
MORPHOS Unified Command Line Interface
Section 37 of MASTER_BUILD_SPEC:
Commands:
  list-agents               List all registered versioned agents
  run <agent_id> "<input>"  Execute an agent in-place on a user task
  evolve "<goal>"           Run autonomous evolutionary agent synthesis
  pareto                    Display the multi-objective Pareto frontier
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Auto-bootstrap into .venv if system python is < 3.10
ROOT = Path(__file__).resolve().parents[1]
venv_py = ROOT / ".venv" / "bin" / "python"
if sys.version_info < (3, 10) and venv_py.exists() and sys.executable != str(venv_py):
    os.execv(str(venv_py), [str(venv_py)] + sys.argv)

# Add project core to sys.path
sys.path.insert(0, str(ROOT / "core"))

from morphos.evolution import EvolutionEngine
from morphos.models import Domain, RunConfig
from morphos.runtime import execute_agent
from morphos.selection import compute_pareto_front
from morphos.storage import storage


def cmd_list_agents(args: argparse.Namespace) -> None:
    agents = storage.list_agents()
    print("\n═════════════════════════════════════════════════════════════════════════")
    print(f" MORPHOS ENTERPRISE AGENT REGISTRY ({len(agents)} Registered)")
    print("═════════════════════════════════════════════════════════════════════════")
    if not agents:
        print(" No agents found. Use 'evolve' command to synthesize an agent.")
        return

    for a in agents:
        ver = a.active_version()
        readiness_score = ver.readiness.score if ver else 0.0
        readiness_status = ver.readiness.status if ver else "UNKNOWN"
        print(f"\n▶ [{a.agent_id}] {a.name}")
        print(f"  Domain: {a.domain} | Current Version: {a.current_version} | Status: {a.status}")
        print(f"  Production Readiness: {readiness_score:.1f}% [{readiness_status}]")
        print(f"  Description: {a.description[:90]}...")
        if ver:
            print(f"  Orchestration: {ver.genome.orchestration} | Roles: {' → '.join(ver.roles)}")
            print(f"  Tools: {', '.join(ver.tools)}")
    print("\n")


def cmd_run(args: argparse.Namespace) -> None:
    agent_id = args.agent_id
    task_input = args.input
    version = args.version

    print(f"\n[MORPHOS RUNNER] Dispatching Agent '{agent_id}' (version: {version or 'active'})...")
    print(f"Input Task: \"{task_input}\"")

    try:
        res = execute_agent(agent_id, task_input, version_str=version)
        print("\n═════════════════════════════════════════════════════════════════════════")
        print(f" EXECUTION RESULT [{res.run_id}] - Status: {res.status.upper()}")
        print("═════════════════════════════════════════════════════════════════════════")
        print(res.output)
        print("═════════════════════════════════════════════════════════════════════════")
        print(f" Latency: {res.duration_ms:.1f}ms | Tools Called: {len(res.tool_calls)} | Cost: ${res.cost_usd:.6f}")
        print(f" Contract Satisfied: {res.contract_valid} | Regression Flagged: {res.regression_flagged}")

        if res.claims:
            print("\n Grounded Claims:")
            for c in res.claims:
                status = "[VERIFIED]" if c.supported else "[UNVERIFIED]"
                print(f"  {status} {c.text}")
        print("\n")
    except Exception as exc:
        print(f"\n[ERROR] Execution failed: {exc}", file=sys.stderr)
        sys.exit(1)


def cmd_evolve(args: argparse.Namespace) -> None:
    goal = args.goal
    generations = args.generations
    population = args.population
    domain_str = args.domain

    domain_val = None
    if domain_str:
        try:
            domain_val = Domain(domain_str)
        except ValueError:
            print(f"Warning: Unknown domain '{domain_str}'. Auto-detecting.", file=sys.stderr)

    print("\n═════════════════════════════════════════════════════════════════════════")
    print(" MORPHOS AUTONOMOUS AGENT EVOLUTION LABORATORY")
    print(f" Goal: \"{goal}\"")
    print(f" Generations: {generations} | Population: {population}")
    print("═════════════════════════════════════════════════════════════════════════\n")

    engine = EvolutionEngine()
    config = RunConfig(
        goal=goal,
        generations=generations,
        population=population,
        mode="live",
        domain=domain_val,
        use_llm=not args.no_llm,
    )

    snapshot = engine.create(config)
    print(f"[RUN CREATED] ID: {snapshot.id} | Domain: {snapshot.task.domain.value}")
    print(f"Inferred Capabilities: {', '.join(snapshot.task.required_capabilities)}\n")

    for event in engine.stream(snapshot.id):
        if event.type == "generation":
            gen = event.payload.get("generation", 0)
            print(f"─── Generation {gen} ──────────────────────────────────────────")
        elif event.type == "specimen_start":
            spec_id = event.payload.get("id")
            label = event.payload.get("label")
            print(f"  • Evaluating Candidate [{spec_id}]: {label}")
        elif event.type == "specimen_result":
            spec = event.payload.get("specimen", {})
            metrics = spec.get("metrics", {})
            fit = metrics.get("fitness", 0.0)
            acc = metrics.get("accuracy", 0.0) * 100
            print(f"    ↳ Fitness: {fit:.1f} pts | Accuracy: {acc:.1f}%")
        elif event.type == "champion":
            champ = event.payload.get("specimen", {})
            print("\n═════════════════════════════════════════════════════════════════════")
            print(f" CHAMPION AGENT EVOLVED: {champ.get('id')} (Gen {champ.get('generation')})")
            print("═════════════════════════════════════════════════════════════════════")
            metrics = champ.get("metrics", {})
            print(f" Fitness: {metrics.get('fitness', 0):.1f} | Accuracy: {metrics.get('accuracy', 0)*100:.1f}%")
            print(f" Orchestration: {champ.get('genome', {}).get('orchestration')}")
            print(f" Roles: {' → '.join(champ.get('genome', {}).get('roles', []))}")
            print(f" Tools: {', '.join(champ.get('genome', {}).get('tools', []))}")

    agents = storage.list_agents()
    if agents:
        latest = agents[0]
        print(f"\n[SAVED TO REGISTRY] Agent ID: {latest.agent_id} ({latest.name})")
        print(f"Run with: python3 scripts/morphos_cli.py run {latest.agent_id} \"<your task>\"\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="MORPHOS Autonomous Agent Engineering CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # list-agents
    subparsers.add_parser("list-agents", help="List all registered versioned agents")

    # run
    run_parser = subparsers.add_parser("run", help="Execute an agent in-place on a user task")
    run_parser.add_argument("agent_id", help="Target agent ID (e.g., agent_e62fa3a0)")
    run_parser.add_argument("input", help="Task input prompt string")
    run_parser.add_argument("--version", "-v", default=None, help="Target version (e.g. v1, v2)")

    # evolve
    evolve_parser = subparsers.add_parser("evolve", help="Run autonomous evolutionary agent synthesis")
    evolve_parser.add_argument("goal", help="User task or objective string")
    evolve_parser.add_argument("--domain", "-d", default=None, help="Domain (cybersecurity, api_integration, etc.)")
    evolve_parser.add_argument("--generations", "-g", type=int, default=2, help="Generations (default: 2)")
    evolve_parser.add_argument("--population", "-p", type=int, default=3, help="Population (default: 3)")
    evolve_parser.add_argument("--no-llm", action="store_true", help="Disable external LLM inference")

    args = parser.parse_args()
    if args.command == "list-agents":
        cmd_list_agents(args)
    elif args.command == "run":
        cmd_run(args)
    elif args.command == "evolve":
        cmd_evolve(args)


if __name__ == "__main__":
    main()

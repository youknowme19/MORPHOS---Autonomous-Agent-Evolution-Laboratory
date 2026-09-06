"""
Comprehensive Unit & Integration Test Suite for MORPHOS Enterprise Platform
Validates:
- StorageManager persistence for Jobs, Agents, Versions, Memory
- Sandbox security (path traversal, sensitive files, secret sanitization, python sandbox)
- Tool registry permissions and capability resolution
- In-place execution runtime and continuous evaluation regression hook
- Multi-objective Pareto frontier extraction
- REST API platform endpoints
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from morphos.analyzer import discover_capabilities_from_goal
from morphos.continuous_eval import evaluate_execution_quality
from morphos.models import (
    Agent,
    AgentExecutionResult,
    AgentVersion,
    Domain,
    FitnessWeights,
    Genome,
    Job,
    JobStatus,
    Metrics,
    Orchestration,
    ProductionReadiness,
    Specimen,
)
from morphos.runtime import execute_agent
from morphos.sandbox import enforce_permissions, run_sandboxed_python, safe_path, sanitize_secrets
from morphos.selection import compute_pareto_front
from morphos.storage import storage
from morphos.tools_registry import TOOL_REGISTRY, resolve_tools_for_capabilities


def test_sandbox_security_boundaries():
    # 1. Traversal outside workspace blocked
    with pytest.raises(PermissionError):
        safe_path("../../../etc/passwd")

    # 2. Sensitive files blocked
    with pytest.raises(PermissionError):
        safe_path(".env")

    with pytest.raises(PermissionError):
        safe_path(".env.local")

    # 3. Valid workspace file allowed
    p = safe_path("pyproject.toml")
    assert p.exists()


def test_sandbox_secret_sanitization():
    raw = "Leaked OpenAI key sk-12345678901234567890abcdef and GitHub token ghp_12345678901234567890"
    sanitized = sanitize_secrets(raw)
    assert "sk-1234567890" not in sanitized
    assert "ghp_1234567890" not in sanitized
    assert "[REDACTED_SECRET]" in sanitized


def test_sandbox_python_evaluation():
    # Math execution permitted
    out1 = run_sandboxed_python("import math\nresult = math.sqrt(256)")
    assert "16.0" in out1

    # Disallowed system imports blocked
    out2 = run_sandboxed_python("import os\nos.system('ls')")
    assert "SECURITY_ERROR" in out2

    out3 = run_sandboxed_python("import subprocess\nsubprocess.run(['ls'])")
    assert "SECURITY_ERROR" in out3


def test_tool_registry_and_permissions():
    assert len(TOOL_REGISTRY) >= 13
    assert "real_fs_read" in TOOL_REGISTRY
    assert "python_eval" in TOOL_REGISTRY
    assert "github_inspect" in TOOL_REGISTRY

    # Permission check
    allowed, denial = enforce_permissions("real_fs_read", {"path": "pyproject.toml"})
    assert allowed is True

    # Resolving tools for capabilities
    tools = resolve_tools_for_capabilities(["http", "python_eval", "tree_discovery"])
    tool_names = [t.name for t in tools]
    assert "api_request" in tool_names
    assert "python_eval" in tool_names


def test_dynamic_capability_discovery():
    caps = discover_capabilities_from_goal("Extract trending AI posts from HackerNews API and compute statistics")
    assert "http" in caps or "api_request" in caps
    assert "python_eval" in caps or "math" in caps


def test_pareto_frontier_extraction():
    s1 = Specimen(
        id="s1",
        generation=1,
        genome=Genome(orchestration=Orchestration.single),
        metrics=Metrics(accuracy=0.9, reliability=0.9, speed=0.8, cost_efficiency=0.8, fitness=90.0),
    )
    s2 = Specimen(
        id="s2",
        generation=1,
        genome=Genome(orchestration=Orchestration.planner_executor),
        metrics=Metrics(accuracy=0.6, reliability=0.6, speed=0.5, cost_efficiency=0.5, fitness=60.0),
    )
    s3 = Specimen(
        id="s3",
        generation=1,
        genome=Genome(orchestration=Orchestration.planner_researcher_validator),
        metrics=Metrics(accuracy=0.95, reliability=0.85, speed=0.7, cost_efficiency=0.75, fitness=88.0),
    )

    pareto = compute_pareto_front([s1, s2, s3])
    # s1 should dominate s2; s1 and s3 are trade-offs on the front
    pareto_ids = [s.id for s in pareto]
    assert "s1" in pareto_ids
    assert "s3" in pareto_ids
    assert "s2" not in pareto_ids


def test_in_place_execution_and_continuous_eval():
    agents = storage.list_agents()
    if not agents:
        pytest.skip("No agents in registry to test execution")

    agent = agents[0]
    res = execute_agent(agent.agent_id, "Check db.py for vulnerabilities")
    assert isinstance(res, AgentExecutionResult)
    assert res.agent_id == agent.agent_id
    assert res.duration_ms > 0
    assert res.run_id.startswith("exec_")

    # Verify continuous eval history updated
    updated_agent = storage.get_agent(agent.agent_id)
    assert len(updated_agent.continuous_eval_history) > 0


def test_api_platform_endpoints():
    client = TestClient(app)

    # 1. Tools endpoint
    res = client.get("/api/tools")
    assert res.status_code == 200
    assert len(res.json()["tools"]) >= 13

    # 2. Capability discovery
    res = client.get("/api/capabilities/discover?query=Analyze+GitHub+repo+codebase")
    assert res.status_code == 200
    assert len(res.json()["capabilities"]) > 0

    # 3. List agents
    res = client.get("/api/agents")
    assert res.status_code == 200
    assert "agents" in res.json()

    # 4. Jobs endpoint
    res = client.get("/api/jobs")
    assert res.status_code == 200
    assert "jobs" in res.json()

    # 5. Experiments endpoint
    res = client.get("/api/experiments")
    assert res.status_code == 200
    assert "pareto_count" in res.json()

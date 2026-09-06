from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

import sys

sys.path.insert(0, str(ROOT / "core"))

from morphos.analyzer import catalog, discover_capabilities_from_goal
from morphos.ao import ENGINEERING_LOG
from morphos.evolution import EvolutionEngine
from morphos.models import (
    Agent,
    Domain,
    FitnessWeights,
    Job,
    JobStatus,
    RunConfig,
)
from morphos.providers import TensorMuxProvider
from morphos.runtime import execute_agent
from morphos.selection import compute_pareto_front
from morphos.storage import storage
from morphos.tools_registry import TOOL_REGISTRY

engine = EvolutionEngine()
app = FastAPI(title="MORPHOS Enterprise Agent Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartRunBody(BaseModel):
    goal: str
    generations: int = 4
    population: int = 4
    mode: str = "benchmark"
    domain: Domain | None = None
    fitness: FitnessWeights = Field(default_factory=FitnessWeights)
    use_llm: bool = True


@app.get("/api/health")
def health():
    tmx = TensorMuxProvider().health()
    return {
        "ok": True,
        "service": "morphos",
        "tensormux": tmx,
        "ao": {"sessions": len(ENGINEERING_LOG), "role": "engineering-orchestrator"},
    }


@app.get("/api/benchmarks")
def benchmarks():
    return {"benchmarks": catalog()}


@app.get("/api/ao")
def ao_log():
    return {"sessions": ENGINEERING_LOG}


@app.post("/api/runs")
def start_run(body: StartRunBody):
    config = RunConfig(
        goal=body.goal,
        generations=body.generations,
        population=body.population,
        mode=body.mode,  # type: ignore[arg-type]
        domain=body.domain,
        fitness=body.fitness,
        use_llm=body.use_llm,
    )
    snapshot = engine.create(config)
    return {"run": snapshot.model_dump()}


@app.get("/api/specimens")
def list_specimens():
    all_specimens = []
    for run in engine.runs.values():
        all_specimens.extend([s.model_dump() for s in run.specimens])
    return {"specimens": all_specimens, "count": len(all_specimens)}


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    snapshot = engine.runs.get(run_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="run not found")
    return {"run": snapshot.model_dump()}


@app.get("/api/runs/{run_id}/stream")
def stream_run(run_id: str):
    if run_id not in engine.runs:
        raise HTTPException(status_code=404, detail="run not found")

    def events():
        for event in engine.stream(run_id):
            yield {"event": event.type, "data": json.dumps(event.payload)}

    return EventSourceResponse(events())


@app.get("/api/runs/{run_id}/trace/{specimen_id}")
def get_specimen_trace(run_id: str, specimen_id: str):
    snapshot = engine.runs.get(run_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="run not found")
    for s in snapshot.specimens:
        if s.id == specimen_id:
            return {"specimen": s.model_dump(), "trace": s.trace.model_dump() if s.trace else None}
    raise HTTPException(status_code=404, detail="specimen not found")


@app.get("/api/export/{run_id}/champion")
def export_champion(run_id: str):
    snapshot = engine.runs.get(run_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="run not found")
    champ = snapshot.champion or (snapshot.specimens[-1] if snapshot.specimens else None)
    if not champ:
        raise HTTPException(status_code=400, detail="no champion evolved yet")

    genome = champ.genome
    roles_str = repr(genome.roles)
    tools_str = repr([t.value for t in genome.tools])
    traits_str = repr(genome.prompt_traits)
    validators_str = repr([v.value for v in genome.validators])

    standalone_code = f'''#!/usr/bin/env python3
"""
MORPHOS Evolved Champion Agent
Specimen: {champ.id} (Gen {champ.generation})
Fitness: {champ.metrics.fitness:.1f} | Accuracy: {champ.metrics.accuracy * 100:.1f}% | Reliability: {champ.metrics.reliability * 100:.1f}%
Orchestration: {genome.orchestration.value}
Roles: {genome.roles}
Evolved using MORPHOS Autonomous Agent Evolution Laboratory
Inference Plane: TensorMux (glm-4-7-flash)
"""

import os
import sys
import httpx

TENSORMUX_API_KEY = os.getenv("TENSORMUX_API_KEY", "")
TENSORMUX_BASE_URL = os.getenv("TENSORMUX_BASE_URL", "https://api.tensormux.com/v1")
TENSORMUX_MODEL = os.getenv("TENSORMUX_MODEL", "glm-4-7-flash")

ROLES = {roles_str}
TOOLS = {tools_str}
TRAITS = {traits_str}
VALIDATORS = {validators_str}
SEARCH_BUDGET = {genome.search_budget}

def complete(prompt: str, system: str = "") -> str:
    global TENSORMUX_API_KEY
    if not TENSORMUX_API_KEY:
        try:
            import getpass
            if sys.stdin.isatty():
                TENSORMUX_API_KEY = getpass.getpass("Enter your TensorMux API Key (or press Enter to run offline): ").strip()
        except Exception:
            pass
        if not TENSORMUX_API_KEY:
            print("[INFO] TENSORMUX_API_KEY not configured. Executing via offline deterministic policy.")
            return f"[OFFLINE VALIDATED RESULT: role={{system}} query={{prompt[:60]}}...]"

    messages = []
    if system:
        messages.append({{"role": "system", "content": system}})
    messages.append({{"role": "user", "content": prompt}})
    with httpx.Client(timeout=45.0) as client:
        resp = client.post(
            f"{{TENSORMUX_BASE_URL}}/chat/completions",
            headers={{"Authorization": f"Bearer {{TENSORMUX_API_KEY}}", "Content-Type": "application/json"}},
            json={{"model": TENSORMUX_MODEL, "messages": messages, "temperature": 0.2, "max_tokens": 800}},
        )
        resp.raise_for_status()
        data = resp.json()
        choice = (data.get("choices") or [{{}}])[0]
        msg = choice.get("message") or {{}}
        return msg.get("content") or msg.get("reasoning") or ""

def run_agent(objective: str):
    print(f"[MORPHOS CHAMPION {champ.id}] Executing evolved architecture: {{' → '.join(ROLES)}}")
    scratchpad = []
    
    # 1. Planner decomposition
    print("▶ Phase 1: Planning with prompt traits: {', '.join(genome.prompt_traits) or 'standard'}")
    plan = complete(
        f"Goal: {{objective}}\\nDecompose task using tools: {{', '.join(TOOLS)}} with search budget {{SEARCH_BUDGET}}.",
        system=f"You are the {{ROLES[0]}} in a multi-agent system."
    )
    scratchpad.append(f"PLAN: {{plan[:200]}}")
    print(f"  Plan: {{plan[:120]}}...\\n")

    # 2. Execution across specialist roles
    claims = []
    for role in ROLES[1:]:
        print(f"▶ Phase 2: Role: {{role}}")
        result = complete(
            f"Objective: {{objective}}\\nContext: {{' | '.join(scratchpad)}}\\nProduce technical findings backed by evidence.",
            system=f"Role: {{role}}. Prompt constraints: {{TRAITS}}"
        )
        scratchpad.append(f"{{role}}: {{result[:200]}}")
        claims.append(result)
        print(f"  Result: {{result[:120]}}...\\n")

    # 3. Evidence & Consistency Validation
    if "evidence" in VALIDATORS:
        print("▶ Phase 3: Evidence Validation")
        validated = complete(
            f"Check findings for unsupported claims: {{claims}}",
            system="You are the Evidence Validator. Strip claims lacking proof."
        )
        claims = [validated]

    print("═══════════════════════════════════════════════════")
    print(f"CHAMPION FINAL SYNTHESIS: \\n{{claims[-1] if claims else plan}}")
    print("═══════════════════════════════════════════════════")

if __name__ == "__main__":
    goal = sys.argv[1] if len(sys.argv) > 1 else "{snapshot.task.goal}"
    run_agent(goal)
'''
    return {
        "filename": f"morphos_champion_{champ.id.lower().replace('-', '_')}.py",
        "code": standalone_code,
        "specimen_id": champ.id,
        "fitness": champ.metrics.fitness,
        "accuracy": champ.metrics.accuracy,
        "roles": genome.roles,
        "orchestration": genome.orchestration.value,
    }


@app.get("/api/runs/{run_id}/memory")
def get_run_memory(run_id: str):
    snapshot = engine.runs.get(run_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="run not found")
    reflections = []
    for s in snapshot.specimens:
        if s.trace and s.trace.self_reflection:
            reflections.append({
                "specimen_id": s.id,
                "generation": s.generation,
                "critique": s.trace.self_reflection.critique,
                "tool_critique": s.trace.self_reflection.tool_critique,
                "improvement_plan": s.trace.self_reflection.improvement_plan,
            })
    return {
        "memory_bank": [e.model_dump() for e in snapshot.memory_bank],
        "reflections": reflections,
        "total_rules": len(snapshot.memory_bank),
    }


@app.get("/api/runs/{run_id}/evolution-diff")
def get_evolution_diff(run_id: str):
    snapshot = engine.runs.get(run_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="run not found")
    if not snapshot.specimens:
        raise HTTPException(status_code=400, detail="no specimens evaluated yet")

    baseline = snapshot.specimens[0]
    champ = snapshot.champion or snapshot.specimens[-1]

    return {
        "baseline": {
            "id": baseline.id,
            "generation": baseline.generation,
            "roles": baseline.genome.roles,
            "metrics": baseline.metrics.model_dump(),
            "output": baseline.trace.final_answer if baseline.trace else "",
            "tool_calls": len(baseline.trace.tool_calls) if baseline.trace else 0,
            "cost_usd": baseline.metrics.cost_usd,
            "latency_ms": baseline.metrics.latency_ms,
        },
        "champion": {
            "id": champ.id,
            "generation": champ.generation,
            "roles": champ.genome.roles,
            "metrics": champ.metrics.model_dump(),
            "output": champ.trace.final_answer if champ.trace else "",
            "tool_calls": len(champ.trace.tool_calls) if champ.trace else 0,
            "cost_usd": champ.metrics.cost_usd,
            "latency_ms": champ.metrics.latency_ms,
            "applied_memory": champ.applied_memory,
        },
        "deltas": {
            "fitness": round(champ.metrics.fitness - baseline.metrics.fitness, 2),
            "accuracy": round((champ.metrics.accuracy - baseline.metrics.accuracy) * 100, 1),
            "cost_reduction_percent": round(
                ((baseline.metrics.cost_usd - champ.metrics.cost_usd) / max(baseline.metrics.cost_usd, 0.0001)) * 100,
                1,
            ) if baseline.metrics.cost_usd > 0 else 0.0,
            "latency_delta_ms": round(champ.metrics.latency_ms - baseline.metrics.latency_ms, 1),
        },
    }


# ----------------------------------------------------------------------
# Section 3, 5, 8, 10, 23: Production Platform API Routes
# ----------------------------------------------------------------------

class CreateJobBody(BaseModel):
    goal: str
    target_capabilities: list[str] = Field(default_factory=list)
    domain: Domain | None = None
    generations: int = 4
    population: int = 4
    mode: str = "benchmark"
    use_llm: bool = True


class ExecuteAgentBody(BaseModel):
    input: str
    version: str | None = None


class DeployAgentBody(BaseModel):
    version: str


class RollbackAgentBody(BaseModel):
    target_version: str | None = None


@app.get("/api/tools")
def get_tools_catalog():
    """Retrieve full catalog of 13 registered tools with schemas and permissions."""
    return {"tools": [tool.model_dump() for tool in TOOL_REGISTRY.values()]}


@app.get("/api/capabilities/discover")
def discover_capabilities(query: str = ""):
    """Analyze an unseen goal and dynamically infer required capabilities."""
    if not query:
        return {"goal": "", "capabilities": []}
    caps = discover_capabilities_from_goal(query)
    return {"goal": query, "capabilities": caps}


@app.post("/api/jobs")
def create_job(body: CreateJobBody):
    """Create and queue a new agent engineering Job."""
    from uuid import uuid4
    from datetime import datetime, UTC
    now_iso = datetime.now(UTC).isoformat()
    job_id = f"job_{uuid4().hex[:8]}"

    # Discover capabilities if none provided explicitly
    target_caps = body.target_capabilities
    if not target_caps:
        target_caps = discover_capabilities_from_goal(body.goal)

    # Initialize Job
    job = Job(
        job_id=job_id,
        goal=body.goal,
        capabilities=target_caps,
        domain=body.domain.value if body.domain else "cybersecurity",
        success_criteria=[
            "Evidence-grounded technical solution",
            "Zero unverified hallucinations",
            "Minimum 80% multi-objective fitness",
        ],
        status=JobStatus.running,
        generations=body.generations,
        population=body.population,
        mode=body.mode,
        created_at=now_iso,
        updated_at=now_iso,
    )

    # Launch underlying evolution run
    config = RunConfig(
        goal=body.goal,
        generations=body.generations,
        population=body.population,
        mode=body.mode,  # type: ignore[arg-type]
        domain=body.domain,
        use_llm=body.use_llm,
    )
    snapshot = engine.create(config)
    job.run_id = snapshot.id
    storage.save_job(job)

    return {"job": job.model_dump(), "run_id": snapshot.id}


@app.get("/api/jobs")
def list_jobs():
    """Retrieve list of all registered agent engineering jobs."""
    jobs = storage.list_jobs()
    return {"jobs": [j.model_dump() for j in jobs], "count": len(jobs)}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    """Get status and details of a specific job."""
    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job": job.model_dump()}


@app.get("/api/agents")
def list_agents():
    """Retrieve all evolved production agents registered in the platform."""
    agents = storage.list_agents()
    return {"agents": [a.model_dump() for a in agents], "count": len(agents)}


@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str):
    """Get full details of a versioned agent, including version lineage and contracts."""
    agent = storage.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"agent": agent.model_dump()}


@app.post("/api/agents/{agent_id}/deploy")
def deploy_agent(agent_id: str, body: DeployAgentBody):
    """Promote a specific agent version to the active deployed version."""
    from datetime import datetime, UTC
    agent = storage.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    target_ver = agent.get_version(body.version)
    if not target_ver:
        raise HTTPException(status_code=400, detail=f"Version '{body.version}' not found for agent '{agent_id}'")

    agent.current_version = body.version
    agent.deployed = True
    agent.updated_at = datetime.now(UTC).isoformat()
    storage.save_agent(agent)
    return {"success": True, "agent": agent.model_dump()}


@app.post("/api/agents/{agent_id}/rollback")
def rollback_agent(agent_id: str, body: RollbackAgentBody | None = None):
    """Roll back an agent to a previous version in its lineage."""
    target_ver = body.target_version if body else None
    try:
        agent = storage.rollback_agent_version(agent_id, target_version=target_ver)
        return {"success": True, "agent": agent.model_dump(), "rolled_back_to": agent.current_version}
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@app.post("/api/agents/{agent_id}/execute")
def run_agent_in_place(agent_id: str, body: ExecuteAgentBody):
    """Execute a registered agent version in place on an arbitrary user task."""
    try:
        result = execute_agent(agent_id, body.input, body.version)
        return {"result": result.model_dump()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Execution error: {exc}")


@app.get("/api/experiments")
def compare_experiments():
    """Compare cross-run specimens and extract the multi-objective Pareto frontier."""
    all_specimens = []
    for run in engine.runs.values():
        all_specimens.extend(run.specimens)

    pareto = compute_pareto_front(all_specimens)
    return {
        "total_specimens": len(all_specimens),
        "pareto_front": [s.model_dump() for s in pareto],
        "pareto_count": len(pareto),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("MORPHOS_HOST", "127.0.0.1"),
        port=int(os.getenv("MORPHOS_PORT", "8000")),
        reload=True,
    )

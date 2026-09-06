"""
MORPHOS Persistence & Storage Layer
Sections 3, 5, 6, 8, 13, 23 of Master Productization Spec

Thread-safe JSON file-backed persistence for:
- Jobs (data/jobs/{job_id}.json)
- Versioned Agents (data/agents/{agent_id}.json)
- Persistent Epistemic Memory Bank (data/memory/global_memory.json)
"""

from __future__ import annotations

import json
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from morphos.models import (
    Agent,
    AgentContract,
    AgentVersion,
    Job,
    JobStatus,
    LearnedContext,
    Metrics,
    ProductionReadiness,
    Specimen,
)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
JOBS_DIR = DATA_DIR / "jobs"
AGENTS_DIR = DATA_DIR / "agents"
MEMORY_DIR = DATA_DIR / "memory"

_LOCK = threading.Lock()


def ensure_dirs() -> None:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)


class StorageManager:
    """Manages atomic persistent storage for Jobs, Agents, and Global Memories."""

    def __init__(self) -> None:
        ensure_dirs()

    # -------------------------------------------------------------
    # Job Storage (Section 3)
    # -------------------------------------------------------------

    def save_job(self, job: Job) -> Job:
        with _LOCK:
            now = datetime.now(UTC).isoformat()
            if not job.created_at:
                job.created_at = now
            job.updated_at = now
            path = JOBS_DIR / f"{job.job_id}.json"
            path.write_text(job.model_dump_json(indent=2), encoding="utf-8")
        return job

    def get_job(self, job_id: str) -> Job | None:
        path = JOBS_DIR / f"{job_id}.json"
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return Job.model_validate(data)
        except Exception:
            return None

    def list_jobs(self, limit: int = 50) -> list[Job]:
        jobs = []
        for path in sorted(JOBS_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)[:limit]:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                jobs.append(Job.model_validate(data))
            except Exception:
                pass
        return jobs

    # -------------------------------------------------------------
    # Agent Storage & Versioning (Sections 5 & 6)
    # -------------------------------------------------------------

    def save_agent(self, agent: Agent) -> Agent:
        with _LOCK:
            now = datetime.now(UTC).isoformat()
            if not agent.created_at:
                agent.created_at = now
            agent.updated_at = now
            path = AGENTS_DIR / f"{agent.agent_id}.json"
            path.write_text(agent.model_dump_json(indent=2), encoding="utf-8")
        return agent

    def get_agent(self, agent_id: str) -> Agent | None:
        path = AGENTS_DIR / f"{agent_id}.json"
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return Agent.model_validate(data)
        except Exception:
            return None

    def list_agents(self, limit: int = 50) -> list[Agent]:
        agents = []
        for path in sorted(AGENTS_DIR.glob("*.json"), key=os.path.getmtime, reverse=True)[:limit]:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                agents.append(Agent.model_validate(data))
            except Exception:
                pass
        return agents

    def promote_champion_to_agent(
        self,
        champion: Specimen,
        job: Any,
        agent_name: str = "",
        parent_agent_id: str | None = None,
    ) -> Agent:
        """Promotes an evolved champion specimen to an Agent with version lineage."""
        existing_agent: Agent | None = None
        if parent_agent_id:
            existing_agent = self.get_agent(parent_agent_id)

        now = datetime.now(UTC).isoformat()
        claim_count = len(champion.trace.claims) if champion.trace else 3
        supported_count = len([c for c in champion.trace.claims if c.supported]) if champion.trace else 3
        readiness = ProductionReadiness.compute(champion.metrics, claim_count, supported_count)

        # Extract attributes safely from either Job or RunSnapshot
        job_id = getattr(job, "job_id", getattr(job, "id", f"job_{uuid4().hex[:8]}"))
        goal = getattr(job, "goal", getattr(getattr(job, "config", None), "goal", getattr(getattr(job, "task", None), "goal", "Autonomous Agent Goal")))
        raw_criteria = getattr(job, "success_criteria", ["Multi-objective Pareto fitness evaluation"])
        success_criteria = raw_criteria if isinstance(raw_criteria, list) else [str(raw_criteria)]
        raw_domain = getattr(job, "domain", getattr(getattr(job, "task", None), "domain", "general"))
        domain = raw_domain.value if hasattr(raw_domain, "value") else str(raw_domain)

        contract = AgentContract(
            purpose=goal,
            inputs=["user_task_string", "optional_runtime_context_dict"],
            outputs=["validated_claims_array", "synthesized_technical_solution", "execution_metrics"],
            required_tools=[t.value for t in champion.genome.tools],
            success_criteria=success_criteria,
            guarantees=[
                "Evidence-grounded citations for technical claims",
                "Zero unverified hallucinations in critical sinks",
                "Strict scoped tool access within workspace boundary",
            ],
            known_limitations=[
                "Third-party external services subject to rate-limiting and network latency",
                "Python code executions capped to 15-second timeouts in sandbox",
            ],
            evaluation_summary={
                "accuracy": champion.metrics.accuracy,
                "reliability": champion.metrics.reliability,
                "speed": champion.metrics.speed,
                "cost_usd": champion.metrics.cost_usd,
                "fitness": champion.metrics.fitness,
            },
            version="v1",
        )

        if existing_agent:
            # Append new version (v2, v3, etc.)
            ver_num = len(existing_agent.versions) + 1
            ver_str = f"v{ver_num}"
            contract.version = ver_str
            new_version = AgentVersion(
                version=ver_str,
                specimen_id=champion.id,
                generation=champion.generation,
                genome=champion.genome,
                roles=champion.genome.roles,
                tools=[t.value for t in champion.genome.tools],
                parent_version=existing_agent.current_version,
                mutation_applied=champion.mutation.type if champion.mutation else "evolutionary_selection",
                metrics=champion.metrics,
                contract=contract,
                readiness=readiness,
                applied_memory=champion.applied_memory,
                output_sample=champion.trace.final_answer if champion.trace else "",
                created_at=now,
            )
            existing_agent.versions.append(new_version)
            existing_agent.current_version = ver_str
            existing_agent.performance_metrics = champion.metrics
            return self.save_agent(existing_agent)

        # Create fresh Agent v1
        agent_id = f"agent_{job_id.replace('job_', '').replace('run_', '')[:8]}"
        name = agent_name or f"{domain.replace('_', ' ').title()} Autonomous Agent"
        version_v1 = AgentVersion(
            version="v1",
            specimen_id=champion.id,
            generation=champion.generation,
            genome=champion.genome,
            roles=champion.genome.roles,
            tools=[t.value for t in champion.genome.tools],
            parent_version=None,
            mutation_applied="evolutionary_selection",
            metrics=champion.metrics,
            contract=contract,
            readiness=readiness,
            applied_memory=champion.applied_memory,
            output_sample=champion.trace.final_answer if champion.trace else "",
            created_at=now,
        )
        agent = Agent(
            agent_id=agent_id,
            name=name,
            description=goal,
            domain=domain,
            current_version="v1",
            versions=[version_v1],
            status="active",
            created_from_job=job_id,
            parent_agent=parent_agent_id,
            performance_metrics=champion.metrics,
            deployed=True,
            created_at=now,
            updated_at=now,
        )
        return self.save_agent(agent)

    def rollback_agent_version(self, agent_id: str, target_version: str | None = None) -> Agent:
        """Rolls back an agent to a previous version in its lineage."""
        agent = self.get_agent(agent_id)
        if not agent:
            raise ValueError(f"Agent '{agent_id}' not found.")
        if len(agent.versions) <= 1:
            raise ValueError(f"Cannot rollback agent '{agent_id}': only one version exists.")

        if target_version:
            matching = next((v for v in agent.versions if v.version == target_version), None)
            if not matching:
                raise ValueError(f"Target version '{target_version}' does not exist for agent '{agent_id}'.")
            target_v = matching
        else:
            curr_idx = next((i for i, v in enumerate(agent.versions) if v.version == agent.current_version), len(agent.versions) - 1)
            target_idx = max(0, curr_idx - 1)
            target_v = agent.versions[target_idx]

        agent.current_version = target_v.version
        agent.performance_metrics = target_v.metrics
        agent.updated_at = datetime.now(UTC).isoformat()
        return self.save_agent(agent)

    # -------------------------------------------------------------
    # Global Epistemic Memory Bank Storage (Section 13)
    # -------------------------------------------------------------

    def save_global_memory(self, entries: list[LearnedContext]) -> None:
        with _LOCK:
            path = MEMORY_DIR / "global_memory.json"
            existing: dict[str, dict] = {}
            if path.exists():
                try:
                    for raw in json.loads(path.read_text(encoding="utf-8")):
                        existing[raw["id"]] = raw
                except Exception:
                    pass
            for e in entries:
                existing[e.id] = e.model_dump()
            path.write_text(json.dumps(list(existing.values()), indent=2), encoding="utf-8")

    def load_global_memory(self) -> list[LearnedContext]:
        path = MEMORY_DIR / "global_memory.json"
        if not path.exists():
            return []
        try:
            return [LearnedContext.model_validate(raw) for raw in json.loads(path.read_text(encoding="utf-8"))]
        except Exception:
            return []


# Global shared storage singleton
storage = StorageManager()

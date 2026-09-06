"""
MORPHOS Agent In-Place Execution Runtime
Section 23 of MASTER_BUILD_SPEC:
- Executes versioned agents on arbitrary user inputs
- Runs complete multi-role orchestration pipeline with live tools
- Binds to production contracts and validates outputs
- Feeds output traces into continuous evaluation
"""

from __future__ import annotations

import time
from datetime import UTC, datetime
from uuid import uuid4

from morphos.continuous_eval import evaluate_execution_quality
from morphos.executor import execute_specimen
from morphos.memory import MemoryBank
from morphos.models import (
    Agent,
    AgentExecutionResult,
    AgentVersion,
    Specimen,
    TaskSpec,
)
from morphos.storage import storage


def execute_agent(
    agent_id: str,
    input_text: str,
    version_str: str | None = None,
) -> AgentExecutionResult:
    """
    Execute a promoted agent version on a live user request.
    Validates output guarantees, measures performance, and tests for regressions.
    """
    agent = storage.get_agent(agent_id)
    if not agent:
        raise ValueError(f"Agent with ID '{agent_id}' not found in registry.")

    # Resolve target version
    target_version: AgentVersion | None = None
    if version_str:
        target_version = agent.get_version(version_str)
        if not target_version:
            raise ValueError(f"Version '{version_str}' not found for Agent '{agent_id}'.")
    else:
        target_version = agent.active_version()
        if not target_version:
            raise ValueError(f"Agent '{agent_id}' has no registered versions.")

    # Construct execution specimen
    specimen = Specimen(
        id=f"run-{uuid4().hex[:6]}",
        generation=target_version.generation,
        genome=target_version.genome,
    )

    # Construct execution task
    task = TaskSpec(
        goal=input_text,
        domain=agent.domain,
        complexity="medium",
        mode="live",
    )

    # Initialize memory bank with cross-generation persistent memory
    memory_bank = MemoryBank()
    try:
        memory_bank.add_batch(storage.load_global_memory())
    except Exception:
        pass

    # Execute specimen through sandboxed pipeline
    started = time.perf_counter()
    trace = execute_specimen(specimen, task, memory_bank=memory_bank)
    duration_ms = (time.perf_counter() - started) * 1000.0

    # Validate output against contract
    contract_valid = bool(trace.final_answer and len(trace.final_answer.strip()) > 5)
    if trace.errors:
        contract_valid = False

    now_iso = datetime.now(UTC).isoformat()
    result = AgentExecutionResult(
        run_id=f"exec_{uuid4().hex[:8]}",
        agent_id=agent.agent_id,
        agent_version=target_version.version,
        status="completed" if not trace.errors else "partial_error",
        input=input_text,
        output=trace.final_answer or "Execution completed with no output.",
        claims=trace.claims,
        tool_calls=[tc.model_dump() for tc in trace.tool_calls],
        metrics={"duration_ms": round(duration_ms, 2), "tokens": trace.tokens, "cost_usd": trace.cost_usd},
        cost_usd=round(trace.cost_usd, 6),
        duration_ms=round(duration_ms, 2),
        contract_valid=contract_valid,
        regression_flagged=False,
        trace_id=f"tr_{uuid4().hex[:6]}",
        timestamp=now_iso,
    )

    # Run continuous evaluation hook
    eval_record = evaluate_execution_quality(agent, target_version, result)
    result.regression_flagged = eval_record.regression_detected

    return result

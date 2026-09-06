"""
MORPHOS Continuous Evaluation & Regression Detection
Section 24 & 31 of MASTER_BUILD_SPEC:
- Evaluates real in-place execution quality
- Tracks historical performance per agent version
- Detects accuracy/reliability degradation and flags regressions
- Triggers or recommends automatic re-evolution
"""

from __future__ import annotations

import time
from typing import Any
from pydantic import BaseModel, Field

from morphos.models import Agent, AgentExecutionResult, AgentVersion
from morphos.storage import storage


class EvalRecord(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    execution_id: str
    version_str: str
    quality_score: float
    grounded_claims: int
    unsupported_claims: int
    tool_failures: int
    duration_ms: float
    regression_detected: bool = False
    notes: str = ""


def evaluate_execution_quality(
    agent: Agent,
    version: AgentVersion,
    result: AgentExecutionResult,
) -> EvalRecord:
    """
    Evaluate real execution result against contract guarantees.
    Calculates empirical quality score based on verified claims and tool errors.
    """
    total_claims = len(result.claims)
    supported_claims = sum(1 for c in result.claims if getattr(c, "supported", False))
    unsupported_claims = total_claims - supported_claims
    tool_failures = sum(
        1 for tc in result.tool_calls
        if "error" in str(tc.get("result", "")).lower() or "fail" in str(tc.get("result", "")).lower()
    )

    # Calculate quality score [0.0 - 1.0]
    if total_claims > 0:
        claim_ratio = supported_claims / total_claims
    else:
        claim_ratio = 1.0 if not tool_failures else 0.5

    # Penalize tool errors
    error_penalty = min(0.4, tool_failures * 0.15)
    quality_score = max(0.0, min(1.0, claim_ratio - error_penalty))

    # Baseline threshold from version readiness
    baseline_acc = (version.readiness.score / 100.0) if version.readiness else 0.7
    regression_threshold = max(0.50, baseline_acc - 0.25)
    regression_detected = quality_score < regression_threshold

    notes = ""
    if regression_detected:
        notes = f"Regression detected: execution quality {quality_score:.2f} fell below threshold {regression_threshold:.2f}."
    else:
        notes = f"Execution quality {quality_score:.2f} within normal tolerance (threshold {regression_threshold:.2f})."

    record = EvalRecord(
        execution_id=result.run_id,
        version_str=version.version,
        quality_score=round(quality_score, 3),
        grounded_claims=supported_claims,
        unsupported_claims=unsupported_claims,
        tool_failures=tool_failures,
        duration_ms=result.duration_ms,
        regression_detected=regression_detected,
        notes=notes,
    )

    # Persist record in agent's history
    agent.continuous_eval_history.append(record.model_dump())
    storage.save_agent(agent)

    return record

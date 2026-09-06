"""
MORPHOS Tool Registry & Execution Sandbox Specifications
Section 10 & 17 of MASTER_BUILD_SPEC
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    permissions: dict[str, str] = Field(
        default_factory=lambda: {
            "filesystem": "READ",
            "network": "ALLOW",
            "python": "SANDBOXED",
            "git": "READ",
            "secrets": "BLOCKED",
        }
    )
    cost_estimate_usd: float = 0.0001
    latency_estimate_ms: int = 25
    failure_modes: list[str] = Field(
        default_factory=lambda: ["timeout", "invalid_arguments", "permission_denied"]
    )


TOOL_REGISTRY: dict[str, ToolDefinition] = {
    "github_inspect": ToolDefinition(
        name="github_inspect",
        description="Inspect remote GitHub repository metadata, tree structure, dependencies, and sensitive files.",
        input_schema={"type": "object", "properties": {"repo_url": {"type": "string"}}, "required": ["repo_url"]},
        output_schema={"type": "object", "properties": {"languages": {"type": "array"}, "files": {"type": "array"}}},
        permissions={"filesystem": "NONE", "network": "ALLOW", "python": "NONE", "git": "READ", "secrets": "BLOCKED"},
        cost_estimate_usd=0.0002,
        latency_estimate_ms=120,
        failure_modes=["rate_limit", "repository_not_found", "empty_tree", "timeout"],
    ),
    "github_issue": ToolDefinition(
        name="github_issue",
        description="Retrieve GitHub issue body, comments, labels, and related discussions for debugging.",
        input_schema={"type": "object", "properties": {"repo": {"type": "string"}, "issue_id": {"type": "string"}}, "required": ["repo", "issue_id"]},
        output_schema={"type": "object", "properties": {"title": {"type": "string"}, "body": {"type": "string"}, "state": {"type": "string"}}},
        permissions={"filesystem": "NONE", "network": "ALLOW", "python": "NONE", "git": "READ", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00015,
        latency_estimate_ms=90,
        failure_modes=["issue_not_found", "rate_limit", "unauthorized"],
    ),
    "api_request": ToolDefinition(
        name="api_request",
        description="Issue scoped HTTP GET/POST queries to external third-party web endpoints.",
        input_schema={"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]},
        output_schema={"type": "object", "properties": {"status": {"type": "int"}, "data": {"type": "string"}}},
        permissions={"filesystem": "NONE", "network": "ALLOW", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.0002,
        latency_estimate_ms=180,
        failure_modes=["http_4xx", "http_5xx", "schema_mismatch", "connection_refused", "timeout"],
    ),
    "python_eval": ToolDefinition(
        name="python_eval",
        description="Execute sandboxed Python code with timeout and memory limits for math, schema parsing, and analytics.",
        input_schema={"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]},
        output_schema={"type": "object", "properties": {"stdout": {"type": "string"}, "error": {"type": "string"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "SANDBOXED", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.0001,
        latency_estimate_ms=65,
        failure_modes=["syntax_error", "runtime_exception", "timeout", "memory_limit_exceeded"],
    ),
    "real_fs_read": ToolDefinition(
        name="real_fs_read",
        description="Read real files from the local filesystem with path boundary enforcement.",
        input_schema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
        output_schema={"type": "object", "properties": {"content": {"type": "string"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00005,
        latency_estimate_ms=18,
        failure_modes=["file_not_found", "permission_denied", "path_outside_workspace"],
    ),
    "read_file": ToolDefinition(
        name="read_file",
        description="Read file contents from repository or benchmark workspace.",
        input_schema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
        output_schema={"type": "object", "properties": {"content": {"type": "string"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00005,
        latency_estimate_ms=16,
        failure_modes=["file_not_found"],
    ),
    "grep": ToolDefinition(
        name="grep",
        description="Search repository files using regex patterns for security sinks, credentials, and error strings.",
        input_schema={"type": "object", "properties": {"pattern": {"type": "string"}}, "required": ["pattern"]},
        output_schema={"type": "object", "properties": {"matches": {"type": "array"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00005,
        latency_estimate_ms=16,
        failure_modes=["invalid_regex", "zero_matches"],
    ),
    "evidence_check": ToolDefinition(
        name="evidence_check",
        description="Audit claims against captured tool output evidence to eliminate hallucinations and false positives.",
        input_schema={"type": "object", "properties": {"claim_id": {"type": "string"}}, "required": ["claim_id"]},
        output_schema={"type": "object", "properties": {"verdict": {"type": "string"}}},
        permissions={"filesystem": "NONE", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00008,
        latency_estimate_ms=15,
        failure_modes=["missing_evidence_citation", "unsupported_assertion"],
    ),
    "list_files": ToolDefinition(
        name="list_files",
        description="List repository directory structure within designated workspace boundary.",
        input_schema={"type": "object", "properties": {"dir": {"type": "string"}}},
        output_schema={"type": "object", "properties": {"files": {"type": "array"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "NONE", "git": "READ", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00003,
        latency_estimate_ms=12,
        failure_modes=["directory_not_found"],
    ),
    "csv_stats": ToolDefinition(
        name="csv_stats",
        description="Analyze tabular CSV datasets, computing column distributions, outliers, and missing counts.",
        input_schema={"type": "object", "properties": {"dataset": {"type": "string"}}},
        output_schema={"type": "object", "properties": {"stats": {"type": "object"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "SANDBOXED", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00008,
        latency_estimate_ms=25,
        failure_modes=["corrupted_csv", "missing_columns"],
    ),
    "calculator": ToolDefinition(
        name="calculator",
        description="Deterministic mathematical computation evaluator for financial and metric assertions.",
        input_schema={"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]},
        output_schema={"type": "object", "properties": {"result": {"type": "number"}}},
        permissions={"filesystem": "NONE", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00002,
        latency_estimate_ms=8,
        failure_modes=["division_by_zero", "invalid_syntax"],
    ),
    "retrieve": ToolDefinition(
        name="retrieve",
        description="Retrieve relevant technical document chunks or knowledge base articles.",
        input_schema={"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]},
        output_schema={"type": "object", "properties": {"documents": {"type": "array"}}},
        permissions={"filesystem": "READ", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00006,
        latency_estimate_ms=20,
        failure_modes=["no_relevant_documents"],
    ),
    "classify": ToolDefinition(
        name="classify",
        description="Classify incoming request into predefined policy categories.",
        input_schema={"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]},
        output_schema={"type": "object", "properties": {"category": {"type": "string"}}},
        permissions={"filesystem": "NONE", "network": "NONE", "python": "NONE", "git": "NONE", "secrets": "BLOCKED"},
        cost_estimate_usd=0.00004,
        latency_estimate_ms=10,
        failure_modes=["ambiguous_classification"],
    ),
}


def get_tool(name: str) -> ToolDefinition | None:
    return TOOL_REGISTRY.get(name)


def resolve_tools_for_capabilities(capabilities: list[str]) -> list[ToolDefinition]:
    """Dynamically maps requested capability names to registered tool definitions."""
    tools: list[ToolDefinition] = []
    seen: set[str] = set()

    cap_map: dict[str, list[str]] = {
        "github": ["github_inspect", "github_issue", "list_files"],
        "github_inspect": ["github_inspect", "list_files"],
        "tree_discovery": ["github_inspect", "list_files"],
        "code_search": ["grep", "read_file", "real_fs_read"],
        "filesystem": ["real_fs_read", "list_files", "grep"],
        "python": ["python_eval", "calculator"],
        "python_eval": ["python_eval"],
        "http": ["api_request"],
        "api_request": ["api_request"],
        "web": ["api_request", "github_inspect"],
        "csv": ["csv_stats", "calculator", "python_eval"],
        "data_analysis": ["csv_stats", "calculator"],
        "security_audit": ["grep", "real_fs_read", "evidence_check"],
        "evidence_check": ["evidence_check"],
        "evidence_validation": ["evidence_check"],
    }

    for cap in capabilities:
        c_low = cap.lower().strip()
        matched_names = cap_map.get(c_low, [c_low] if c_low in TOOL_REGISTRY else [])
        for tool_name in matched_names:
            if tool_name in TOOL_REGISTRY and tool_name not in seen:
                seen.add(tool_name)
                tools.append(TOOL_REGISTRY[tool_name])

    # Always ensure evidence_check is available for epistemic safety
    if "evidence_check" not in seen and "evidence_check" in TOOL_REGISTRY:
        tools.append(TOOL_REGISTRY["evidence_check"])

    return tools


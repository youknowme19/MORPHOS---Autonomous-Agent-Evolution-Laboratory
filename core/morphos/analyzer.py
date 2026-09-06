from morphos.models import Domain, TaskSpec
from morphos.tools_registry import TOOL_REGISTRY, resolve_tools_for_capabilities
from morphos.worlds import detect_domain, get_world


def discover_capabilities_from_goal(goal: str) -> list[str]:
    """Dynamically infers required agent capabilities from an unseen natural language objective."""
    text = goal.lower()
    capabilities: list[str] = []

    if "github.com" in text or "issue #" in text or "pull request" in text or "pr #" in text:
        capabilities.extend(["github", "github_inspect", "tree_discovery"])
    if any(k in text for k in ("http", "api", "endpoint", "rest", "json", "hackernews", "fetch")):
        capabilities.extend(["http", "api_request"])
    if any(k in text for k in ("python", "script", "math", "calculate", "tax", "variance", "eval", "compute", "statistics", "stats")):
        capabilities.extend(["python", "python_eval"])
    if any(k in text for k in ("file", "codebase", "grep", "search", "directory", "vulnerability", "audit")):
        capabilities.extend(["filesystem", "code_search"])
    if any(k in text for k in ("csv", "table", "dataset", "column", "revenue", "ledger")):
        capabilities.extend(["csv", "data_analysis"])

    if not capabilities:
        capabilities = ["code_search", "filesystem", "python"]

    # Always enforce evidence validation capability
    capabilities.append("evidence_validation")
    return list(dict.fromkeys(capabilities))


def analyze_goal(
    goal: str,
    mode: str = "benchmark",
    use_llm: bool = True,
    explicit_capabilities: list[str] | None = None,
) -> TaskSpec:
    domain = detect_domain(goal)
    world = get_world(domain)

    if explicit_capabilities:
        capabilities = list(dict.fromkeys(explicit_capabilities + ["evidence_validation"]))
    elif mode == "live":
        capabilities = discover_capabilities_from_goal(goal)
    else:
        capabilities = list(world.capabilities)

    return TaskSpec(
        goal=goal.strip() or world.goal,
        domain=domain,
        complexity=world.complexity,  # type: ignore[arg-type]
        required_capabilities=capabilities,
        evaluation_metrics=list(world.metrics),
        mode=mode,  # type: ignore[arg-type]
        benchmark_id=world.id,
        use_llm=use_llm,
    )


def catalog() -> list[dict]:
    rows = []
    for domain in (
        Domain.api_integration,
        Domain.codebase_audit,
        Domain.cfo_finance,
        Domain.cybersecurity,
        Domain.data_analysis,
        Domain.research,
        Domain.support,
    ):
        world = get_world(domain)
        rows.append(
            {
                "id": world.id,
                "domain": domain.value,
                "title": world.title,
                "goal": world.goal,
                "complexity": world.complexity,
                "capabilities": world.capabilities,
            }
        )
    return rows

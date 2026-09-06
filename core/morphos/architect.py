from morphos.models import Domain, Genome, MemoryKind, Orchestration, ToolName, ValidatorKind


def _roles_for(orch: Orchestration) -> list[str]:
    mapping = {
        Orchestration.single: ["generalist"],
        Orchestration.planner_executor: ["planner", "executor"],
        Orchestration.planner_researcher_validator: [
            "planner",
            "researcher",
            "validator",
            "finalizer",
        ],
        Orchestration.router_specialists: ["router", "specialist", "critic", "finalizer"],
        Orchestration.adaptive_recovery: [
            "planner",
            "researcher",
            "validator",
            "recovery",
            "finalizer",
        ],
    }
    return mapping[orch]


def seed_population(domain: Domain, size: int = 4) -> list[Genome]:
    common_tools = {
        Domain.cybersecurity: [ToolName.list_files, ToolName.read_file, ToolName.grep],
        Domain.data_analysis: [ToolName.csv_stats, ToolName.calculator],
        Domain.research: [ToolName.retrieve, ToolName.evidence_check],
        Domain.support: [ToolName.classify],
        Domain.live: [ToolName.api_request, ToolName.python_eval, ToolName.evidence_check, ToolName.real_fs_read],
        Domain.api_integration: [ToolName.api_request, ToolName.python_eval, ToolName.evidence_check],
        Domain.codebase_audit: [ToolName.real_fs_read, ToolName.grep, ToolName.list_files, ToolName.evidence_check],
        Domain.cfo_finance: [ToolName.python_eval, ToolName.calculator, ToolName.csv_stats, ToolName.evidence_check],
        Domain.github_repo: [ToolName.github_inspect, ToolName.grep, ToolName.python_eval, ToolName.evidence_check],
        Domain.software_engineering: [ToolName.github_inspect, ToolName.github_issue, ToolName.grep, ToolName.evidence_check],
    }
    tools = common_tools.get(domain, [ToolName.api_request, ToolName.python_eval])

    seeds = [
        Genome(
            orchestration=Orchestration.single,
            tools=tools[:1],
            memory=MemoryKind.none,
            validators=[ValidatorKind.none],
            search_budget=1,
            prompt_traits=["brief"],
            roles=_roles_for(Orchestration.single),
        ),
        Genome(
            orchestration=Orchestration.planner_executor,
            tools=tools[:2] if len(tools) > 1 else tools,
            memory=MemoryKind.scratchpad,
            validators=[ValidatorKind.output],
            search_budget=3,
            prompt_traits=["structured_output"],
            roles=_roles_for(Orchestration.planner_executor),
        ),
        Genome(
            orchestration=Orchestration.planner_researcher_validator,
            tools=list(tools),
            memory=MemoryKind.scratchpad,
            validators=[ValidatorKind.output],
            search_budget=4,
            prompt_traits=["structured_output"],
            roles=["planner", "researcher", "finalizer"],
        ),
        Genome(
            orchestration=Orchestration.router_specialists,
            tools=list(dict.fromkeys(tools + [ToolName.grep])),
            memory=MemoryKind.scratchpad,
            validators=[ValidatorKind.output],
            search_budget=5,
            prompt_traits=["exploratory"],
            roles=["router", "specialist", "critic", "finalizer"],
        ),
    ]
    return seeds[: max(2, min(size, 4))]


def apply_roles(genome: Genome) -> Genome:
    cloned = genome.model_copy(deep=True)
    cloned.roles = _roles_for(cloned.orchestration)
    return cloned

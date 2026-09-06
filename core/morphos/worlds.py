from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from morphos.models import Domain


@dataclass(frozen=True)
class WorldFile:
    path: str
    content: str


@dataclass
class World:
    id: str
    domain: Domain
    title: str
    goal: str
    complexity: str
    files: dict[str, str]
    records: list[dict[str, Any]]
    documents: list[dict[str, str]]
    tickets: list[dict[str, str]]
    ground_truth: list[dict[str, str]]
    capabilities: list[str]
    metrics: list[str]


SECURITY_FILES = {
    "auth.py": '''def login(user, password):
    # Debug leftover — not the critical issue judges should care about.
    print("attempt", user, password)
    if user == "admin" and password == "admin":
        return True
    return False
''',
    "db.py": '''def get_user(conn, user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return conn.execute(query).fetchall()

def search_users(conn, name):
    return conn.execute("SELECT * FROM users WHERE name = '%s'" % name)
''',
    "config.py": '''AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
DEBUG = True
''',
    "utils.py": '''def slugify(value: str) -> str:
    return value.strip().lower().replace(" ", "-")
''',
    "routes.py": '''def render_profile(name):
    return f"<div id='profile'>{name}</div><script>document.getElementById('profile').innerHTML = window.location.hash</script>"
''',
}

DATA_RECORDS = [
    {"day": "2026-08-01", "revenue": 1200, "region": "west", "refunds": 12},
    {"day": "2026-08-02", "revenue": 1180, "region": "west", "refunds": 9},
    {"day": "2026-08-03", "revenue": 1215, "region": "east", "refunds": 11},
    {"day": "2026-08-04", "revenue": 1190, "region": "east", "refunds": 10},
    {"day": "2026-08-05", "revenue": 98000, "region": "west", "refunds": 8},  # spike
    {"day": "2026-08-06", "revenue": 1220, "region": "east", "refunds": None},  # missing
    {"day": "2026-08-07", "revenue": 1175, "region": "west", "refunds": 13},
    {"day": "2026-08-08", "revenue": 40, "region": "east", "refunds": 90},  # collapse + refunds
]

RESEARCH_DOCS = [
    {
        "id": "d1",
        "title": "KV cache reuse",
        "text": "Reusing KV cache across requests reduces prefill cost. Tensormux-style gateways do not own KV cache; engines do.",
    },
    {
        "id": "d2",
        "title": "Routing",
        "text": "Least-inflight routing sends new work to the backend with the fewest in-flight requests, improving tail latency.",
    },
    {
        "id": "d3",
        "title": "Red herring",
        "text": "Some blogs claim that adding more agents always improves accuracy. Controlled studies show the opposite when validators are missing.",
    },
]

SUPPORT_TICKETS = [
    {
        "id": "T-104",
        "text": "I was charged twice for the same invoice. Please refund the duplicate charge.",
        "gold_label": "billing_refund",
        "gold_response": "Acknowledge duplicate charge, open refund, confirm SLA.",
    },
    {
        "id": "T-221",
        "text": "The API returns 401 even with a valid key after we rotated secrets yesterday.",
        "gold_label": "auth_incident",
        "gold_response": "Ask for key last-4, check rotation window, escalate identity.",
    },
    {
        "id": "T-308",
        "text": "How do I export my usage CSV for August?",
        "gold_label": "how_to",
        "gold_response": "Point to Settings → Usage → Export, no refund language.",
    },
]


def security_world() -> World:
    return World(
        id="sec-python-audit",
        domain=Domain.cybersecurity,
        title="Unfamiliar Python repository audit",
        goal="Audit an unfamiliar Python repository for security vulnerabilities.",
        complexity="high",
        files=SECURITY_FILES,
        records=[],
        documents=[],
        tickets=[],
        ground_truth=[
            {
                "id": "sqli",
                "category": "injection",
                "file": "db.py",
                "must_include": "sql",
            },
            {
                "id": "secret",
                "category": "secret",
                "file": "config.py",
                "must_include": "akia",
            },
            {
                "id": "xss",
                "category": "xss",
                "file": "routes.py",
                "must_include": "innerhtml",
            },
        ],
        capabilities=[
            "repository_analysis",
            "code_search",
            "security_reasoning",
            "evidence_validation",
        ],
        metrics=["accuracy", "false_positive_rate", "coverage", "latency", "cost"],
    )


def data_world() -> World:
    return World(
        id="csv-anomalies",
        domain=Domain.data_analysis,
        title="CSV anomaly hunt",
        goal="Analyze a CSV dataset and identify important anomalies and trends.",
        complexity="medium",
        files={},
        records=DATA_RECORDS,
        documents=[],
        tickets=[],
        ground_truth=[
            {"id": "spike", "must_include": "98000"},
            {"id": "missing", "must_include": "missing"},
            {"id": "refunds", "must_include": "refund"},
        ],
        capabilities=["tabular_analysis", "anomaly_detection", "numerical_reasoning"],
        metrics=["analytical_accuracy", "numerical_correctness", "tool_efficiency", "latency", "cost"],
    )


def research_world() -> World:
    return World(
        id="evidence-summary",
        domain=Domain.research,
        title="Evidence-backed technical summary",
        goal="Research a technical topic and produce an evidence-backed summary.",
        complexity="medium",
        files={},
        records=[],
        documents=RESEARCH_DOCS,
        tickets=[],
        ground_truth=[
            {"id": "kv", "must_include": "kv cache"},
            {"id": "routing", "must_include": "least-inflight"},
            {"id": "agents", "must_include": "validator"},
        ],
        capabilities=["retrieval", "synthesis", "citation", "evidence_validation"],
        metrics=["factual_accuracy", "evidence_quality", "coverage", "latency", "cost"],
    )


def support_world() -> World:
    return World(
        id="ticket-triage",
        domain=Domain.support,
        title="Support ticket triage",
        goal="Classify a support ticket, identify the issue, and generate the appropriate response.",
        complexity="low",
        files={},
        records=[],
        documents=[],
        tickets=SUPPORT_TICKETS,
        ground_truth=[
            {"id": "T-104", "must_include": "billing_refund"},
            {"id": "T-221", "must_include": "auth_incident"},
            {"id": "T-308", "must_include": "how_to"},
        ],
        capabilities=["classification", "policy_compliance", "response_generation"],
        metrics=["classification_accuracy", "policy_compliance", "latency", "cost"],
    )


def api_world() -> World:
    return World(
        id="api-hn-intelligence",
        domain=Domain.api_integration,
        title="Third-Party Live API Integration (HackerNews Intelligence)",
        goal="Query third-party HackerNews API (https://hn.algolia.com/api/v1/search), discover response schema, extract top trending AI stories with points and authors, and synthesize verified intelligence.",
        complexity="high",
        files={},
        records=[],
        documents=[],
        tickets=[],
        ground_truth=[
            {"id": "api-schema", "must_include": "hits"},
            {"id": "api-points", "must_include": "points"},
            {"id": "api-author", "must_include": "author"},
            {"id": "api-verified-story", "must_include": "story"},
        ],
        capabilities=["http_client", "schema_discovery", "python_eval", "evidence_check"],
        metrics=["schema_accuracy", "evidence_grounding", "latency", "cost"],
    )


def codebase_world() -> World:
    return World(
        id="live-codebase-audit",
        domain=Domain.codebase_audit,
        title="Live Codebase & Infrastructure Audit",
        goal="Audit live codebase files for security vulnerabilities, hardcoded secrets, and architectural risks.",
        complexity="high",
        files=SECURITY_FILES,
        records=[],
        documents=[],
        tickets=[],
        ground_truth=[
            {"id": "sqli", "must_include": "db.py"},
            {"id": "secret-leak", "must_include": "config.py"},
            {"id": "dom-xss", "must_include": "routes.py"},
        ],
        capabilities=["filesystem_inspection", "regex_audit", "evidence_verification"],
        metrics=["detection_accuracy", "false_positive_elimination", "latency", "cost"],
    )


def finance_world() -> World:
    return World(
        id="cfo-finance-reconciliation",
        domain=Domain.cfo_finance,
        title="CFO Autonomous Finance & Invoice Reconciliation",
        goal="Reconcile cross-border transaction ledgers, calculate multi-currency tax rates via Python evaluation, and flag anomalous variances.",
        complexity="medium",
        files={},
        records=DATA_RECORDS,
        documents=[],
        tickets=[],
        ground_truth=[
            {"id": "cfo-tax-variance", "must_include": "variance"},
            {"id": "cfo-null-handling", "must_include": "missing"},
            {"id": "cfo-spike", "must_include": "98000"},
        ],
        capabilities=["python_eval", "anomaly_detection", "financial_validation"],
        metrics=["calculation_accuracy", "exception_handling", "latency", "cost"],
    )


def github_world() -> World:
    return World(
        id="github-repo-investigation",
        domain=Domain.github_repo,
        title="Live GitHub Repository & Issue Analysis",
        goal="Inspect unfamiliar GitHub repository, discover architecture tree, entry points, and security sensitive sinks.",
        complexity="high",
        files={},
        records=[],
        documents=[],
        tickets=[],
        ground_truth=[
            {"id": "gh-tree", "must_include": "architecture"},
            {"id": "gh-vuln", "must_include": "sensitive"},
            {"id": "gh-lang", "must_include": "language"},
            {"id": "gh-tests", "must_include": "test"},
        ],
        capabilities=["github_inspect", "tree_discovery", "security_audit", "evidence_check"],
        metrics=["tree_accuracy", "sink_isolation", "latency", "cost"],
    )


WORLDS = {
    Domain.cybersecurity: security_world(),
    Domain.data_analysis: data_world(),
    Domain.research: research_world(),
    Domain.support: support_world(),
    Domain.api_integration: api_world(),
    Domain.codebase_audit: codebase_world(),
    Domain.cfo_finance: finance_world(),
    Domain.github_repo: github_world(),
    Domain.software_engineering: github_world(),
    Domain.live: api_world(),
}


def get_world(domain: Domain | None) -> World:
    if domain is None or domain == Domain.live:
        return api_world()
    return WORLDS.get(domain, api_world())


def detect_domain(goal: str) -> Domain:
    text = goal.lower()
    if any(k in text for k in ("github", "repo url", "pull request", "issue #")):
        return Domain.github_repo
    if any(k in text for k in ("api", "endpoint", "hackernews", "hn.algolia", "http", "third party", "third-party")):
        return Domain.api_integration
    if any(k in text for k in ("cfo", "finance", "invoice", "reconcil", "ledger", "tax", "vat")):
        return Domain.cfo_finance
    if any(k in text for k in ("codebase", "local repo", "filesystem", "infrastructure")):
        return Domain.codebase_audit
    if any(k in text for k in ("sql", "vulnerab", "security", "xss")):
        return Domain.cybersecurity
    if any(k in text for k in ("csv", "anomal", "dataset", "revenue", "tabular")):
        return Domain.data_analysis
    if any(k in text for k in ("ticket", "support", "refund", "customer")):
        return Domain.support
    if any(k in text for k in ("research", "summar", "evidence", "citation", "kv cache")):
        return Domain.research
    return Domain.api_integration

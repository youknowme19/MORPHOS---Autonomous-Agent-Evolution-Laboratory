# MORPHOS

**Don't build an agent. Evolve one.**

MORPHOS is an autonomous agent-engineering laboratory. You give it a goal. It generates a population of candidate specimen architectures, executes them against real task worlds, scores them across multi-objective fitness, diagnoses failures, mutates the weakest components, and continuously evolves the system until discovering a champion.

This is not a manual agent builder. It is an autonomous evolution loop.

```text
GOAL → ANALYZE → DESIGN → EXECUTE → EVALUATE → DIAGNOSE → MUTATE → SELECT → CHAMPION
```

---

## Core Capabilities & Verified Subsystems

- **Interactive Architecture DAG**: Visualizes the agent execution pipeline (Planner → Researcher → Validator → Finalizer, or Router → Specialists → Critic) with active execution pulses and mutation badges.
- **Enterprise Agent Registry & Rollback**: Versioned agent management (`/agents`) tracking genome lineage (v1, v2...), production readiness scores, and instant version rollback (`POST /api/agents/{id}/rollback`).
- **Growing Memory Bank**: Diagnostic failures autonomously extract context lessons, injecting learned rules across generations (`applied_memory`).
- **Trace Inspector Drawer (`[ VIEW TRACE ]`)**: Full observability into tool calls, arguments, claim verification badges (supported vs false positive), tokens, latency, and cost in USD.
- **Multi-Language GitHub Analysis**: Discovers directory trees, AST and heuristic entry points across Python, JavaScript/TypeScript, and C/C++, plus GitHub PR inspection.
- **Reality-Hardened Security Sandbox**: Enforces strict AST restrictions on Python execution, disallows directory traversal (`../`), protects sensitive files (`.env`, `.git/config`, `id_rsa`), and redacts API keys/secrets in real-time.
- **Dedicated Failure Replay & What-If Simulation**: Inspects actual observed defects vs expected ground truth, displays confidence score, and allows interactive `[ APPLY MUTATION ]` or `[ WHAT-IF SIM ]`.
- **Standalone Deployable Champion**: Crowns the evolved champion with delta vs baseline and exports standalone runnable Python agent scripts ready to deploy without requiring a background daemon.
- **Continuous Evaluation & Regression Testing**: Evaluates deployed agents against contract rules, latency thresholds, and cost budgets with automatic regression alerts.
- **Unified CLI Tooling**: Complete command-line control (`scripts/morphos_cli.py`) for listing registered agents, in-place agent execution, and autonomous evolutionary synthesis.

---

## Architecture & Technology Stack

| Layer | Technology |
| --- | --- |
| **Lab UI / Web Platform** | Next.js 15, React 19, TypeScript, Tailwind CSS, React Three Fiber, Lucide Icons |
| **Evolution Engine & API** | Python 3.11, FastAPI, Server-Sent Events (SSE), Pydantic v2 |
| **Inference Provider** | TensorMux (`https://api.tensormux.com/v1`, model: `glm-4-7-flash`) with deterministic `FallbackLocalPolicy` |
| **Sandbox & Analysis** | Python AST isolation, path traversal guards, regex secret redaction |
| **Audit & Governance** | Reality audit matrix (`docs/REALITY_AUDIT.md`), Final report (`docs/FINAL_VERIFICATION_REPORT.md`) |

---

## Quick Start

### 1. Environment Setup

```bash
cp .env.example .env   # Configure TENSORMUX_API_KEY (optional; runs FallbackLocalPolicy offline)
```

### 2. Launch with One Command

```bash
bash scripts/dev.sh
```

Or run services individually:

```bash
# Backend API (FastAPI)
source .venv/bin/activate
uvicorn apps.api.main:app --port 8000 --reload

# Frontend Laboratory (Next.js)
cd apps/web && npm install && npm run dev
```

- **Laboratory UI**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **Agent Registry**: [http://127.0.0.1:3000/agents](http://127.0.0.1:3000/agents)
- **FastAPI Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## Unified Command Line Interface (CLI)

The CLI tool auto-bootstraps into the `.venv` runtime:

```bash
# List all registered enterprise agents
python3 scripts/morphos_cli.py list-agents

# Execute an agent on a specific task
python3 scripts/morphos_cli.py run <agent_id> "Audit tests/test_security_hardening.py for security sinks"

# Run autonomous evolutionary synthesis for a goal
python3 scripts/morphos_cli.py evolve "Inspect GitHub repository youknowme19/graph_z3" --generations 2 --population 3
```

---

## Running Automated Tests

All 24 unit, security, and end-to-end integration tests run with standard pytest:

```bash
.venv/bin/pytest -v
```

Test coverage includes:
- `tests/test_end_to_end_evolution.py`: Full evolution cycle, mutation impact, memory injection, agent versioning & rollback.
- `tests/test_security_hardening.py`: Path traversal defense, sensitive file protection, secret redaction, Python AST sandbox isolation.
- `tests/test_evolution.py`: Multi-domain evaluation, live mode, memory bank reflection, API learning, GitHub repo evolution.
- `tests/test_platform.py`: In-place execution, continuous evaluation, tool registry permissions, Pareto frontier extraction.

---

## Verification & Reality Audit Reports

- **Complete Reality Audit**: [docs/REALITY_AUDIT.md](file:///Volumes/SSD/MORPHOS/docs/REALITY_AUDIT.md) — Subsystem-by-subsystem audit across all 30 audit points.
- **Final Verification Report**: [docs/FINAL_VERIFICATION_REPORT.md](file:///Volumes/SSD/MORPHOS/docs/FINAL_VERIFICATION_REPORT.md) — System status matrix, verified real workflows, and operational boundaries.

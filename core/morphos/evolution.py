from __future__ import annotations

from collections.abc import Callable, Iterator
from uuid import uuid4

from morphos.analyzer import analyze_goal
from morphos.ao import ENGINEERING_LOG, session
from morphos.architect import seed_population
from morphos.diagnostics import diagnose
from morphos.evaluator import evaluate
from morphos.executor import execute_specimen
from morphos.memory import MemoryBank
from morphos.models import (
    EvolutionEvent,
    RunConfig,
    RunSnapshot,
    Specimen,
    ToolName,
)
from morphos.mutation import mutate
from morphos.providers import TensorMuxProvider, extract_json, get_provider
from morphos.selection import pick_champion, select_survivors
from morphos.storage import storage
from morphos.telemetry import summarize

EventSink = Callable[[EvolutionEvent], None]


class EvolutionEngine:
    def __init__(self) -> None:
        self.runs: dict[str, RunSnapshot] = {}

    def create(self, config: RunConfig) -> RunSnapshot:
        mode = config.mode
        task = analyze_goal(config.goal, mode=mode, use_llm=config.use_llm)
        if config.domain:
            task.domain = config.domain
        if mode == "live" and config.use_llm:
            task = self._llm_analyze(config.goal, task)
        snapshot = RunSnapshot(
            id=f"run_{uuid4().hex[:8]}",
            config=config,
            task=task,
            status="ready",
            ao_sessions=list(ENGINEERING_LOG),
        )
        snapshot.ao_sessions.append(
            session(
                "AO SESSION RUN",
                "Orchestrate one evolution experiment.",
                f"Domain={task.domain.value} mode={task.mode} generations={config.generations}",
            )
        )
        self.runs[snapshot.id] = snapshot
        return snapshot

    def get_history(self, run_id: str) -> list[Specimen]:
        return self.runs[run_id].specimens

    def stream(self, run_id: str) -> Iterator[EvolutionEvent]:
        snapshot = self.runs[run_id]
        snapshot.status = "running"
        yield EvolutionEvent(type="task", payload=snapshot.task.model_dump())
        genomes = seed_population(snapshot.task.domain, snapshot.config.population)
        history: list[Specimen] = []
        population: list[Specimen] = []
        memory_bank = MemoryBank()
        # Seed cross-run epistemic memory bank from persistent storage
        try:
            persistent_rules = storage.load_global_memory()
            memory_bank.add_batch(persistent_rules)
        except Exception:
            pass

        for generation in range(snapshot.config.generations):
            snapshot.generation = generation
            yield EvolutionEvent(type="generation", payload={"generation": generation})
            if generation == 0:
                batch = [
                    Specimen(id=f"S{generation:02d}-{index:02d}", generation=generation, genome=genome)
                    for index, genome in enumerate(genomes, start=1)
                ]
            else:
                # Rank prior generation by multi-objective fitness
                ranked = sorted(population, key=lambda item: item.metrics.fitness, reverse=True)
                target_size = snapshot.config.population
                batch = []

                # Select survivors across diverse orchestrations
                survivors = select_survivors(population, keep=min(2, len(ranked)))
                if not survivors:
                    survivors = ranked[:1]

                for index in range(1, target_size + 1):
                    # Assign parent: top survivors for first candidates, exploratory for remainder
                    if index == 1:
                        parent = survivors[0]
                    elif index == 2 and len(survivors) > 1:
                        parent = survivors[1]
                    elif index <= len(ranked):
                        parent = ranked[index - 1]
                    else:
                        parent = ranked[(index - 1) % len(ranked)]

                    diagnosis = diagnose(parent, snapshot.task)
                    genome, mutation = mutate(parent.genome, diagnosis)

                    # For higher indices, introduce genetic variations to maintain population diversity
                    if index == 3:
                        if ToolName.grep not in genome.tools and ToolName.grep in (snapshot.task.domain and [ToolName.grep] or []):
                            genome.tools.append(ToolName.grep)
                        genome.search_budget = min(7, genome.search_budget + 1)
                    elif index == 4:
                        genome.search_budget = max(3, genome.search_budget - 1)
                        if "verify_claims" not in genome.prompt_traits and parent.metrics.accuracy >= 0.8:
                            genome.prompt_traits.append("verify_claims")

                    child = Specimen(
                        id=f"S{generation:02d}-{index:02d}",
                        generation=generation,
                        genome=genome,
                        parent_id=parent.id,
                        mutation=mutation,
                        diagnosis=diagnosis,
                    )
                    batch.append(child)
                    yield EvolutionEvent(
                        type="mutation",
                        payload={
                            "parent": parent.id,
                            "child": child.id,
                            "mutation": mutation.model_dump(),
                            "diagnosis": diagnosis.model_dump(),
                        },
                    )

            population = []
            for specimen in batch:
                yield EvolutionEvent(
                    type="specimen_start",
                    payload={"id": specimen.id, "label": specimen.genome.label(), "generation": generation},
                )
                specimen.trace = execute_specimen(specimen, snapshot.task, memory_bank=memory_bank)
                specimen.metrics = evaluate(specimen.trace, snapshot.task, snapshot.config.fitness)
                specimen.diagnosis = diagnose(specimen, snapshot.task)

                # Compute actual mutation delta vs parent if applicable
                if specimen.mutation and specimen.parent_id:
                    parent_ref = next((h for h in history if h.id == specimen.parent_id), None)
                    if parent_ref:
                        delta = round(specimen.metrics.fitness - parent_ref.metrics.fitness, 2)
                        specimen.mutation.fitness_delta = delta
                        specimen.mutation.actual_impact = f"{'+' if delta >= 0 else ''}{delta} pts fitness"

                # Accumulate episodic learnings into cross-generation memory bank with lineage tags
                if specimen.trace and specimen.trace.tool_learnings:
                    for l in specimen.trace.tool_learnings:
                        l.origin_job = snapshot.id
                        l.origin_specimen = specimen.id
                    memory_bank.add_batch(specimen.trace.tool_learnings)
                    snapshot.memory_bank = list(memory_bank.entries)

                population.append(specimen)
                history.append(specimen)

                # Emit reflection and memory events
                if specimen.trace and specimen.trace.self_reflection:
                    yield EvolutionEvent(
                        type="reflection",
                        payload={
                            "specimen_id": specimen.id,
                            "reflection": specimen.trace.self_reflection.model_dump(),
                            "learnings": [l.model_dump() for l in specimen.trace.tool_learnings],
                            "memory_size": len(memory_bank.entries),
                        },
                    )

                yield EvolutionEvent(
                    type="specimen_result",
                    payload={
                        "specimen": specimen.model_dump(),
                    },
                )

            snapshot.specimens = list(history)
            snapshot.telemetry = summarize(history)
            snapshot.memory_bank = list(memory_bank.entries)
            yield EvolutionEvent(
                type="memory_updated",
                payload={
                    "generation": generation,
                    "count": len(memory_bank.entries),
                    "entries": [e.model_dump() for e in memory_bank.entries],
                },
            )
            yield EvolutionEvent(
                type="generation_complete",
                payload={
                    "generation": generation,
                    "leaderboard": [
                        {
                            "id": s.id,
                            "fitness": s.metrics.fitness,
                            "accuracy": s.metrics.accuracy,
                            "label": s.genome.label(),
                        }
                        for s in sorted(population, key=lambda s: s.metrics.fitness, reverse=True)
                    ],
                },
            )

        champion = pick_champion(history)
        champion.champion = True
        snapshot.champion = champion
        snapshot.status = "complete"
        snapshot.specimens = history
        snapshot.telemetry = summarize(history)
        snapshot.ao_sessions.append(
            session(
                "AO SESSION SELECT",
                "Choose champion under multi-objective fitness.",
                f"{champion.id} fitness={champion.metrics.fitness} acc={champion.metrics.accuracy}",
            )
        )

        # Persist memory bank and promote champion to versioned Agent in storage
        try:
            storage.save_global_memory(memory_bank.entries)
            promoted_agent = storage.promote_champion_to_agent(champion, snapshot)
            if promoted_agent:
                act_ver = promoted_agent.active_version()
                readiness_str = f"{act_ver.readiness.score:.1f}% ({act_ver.readiness.status})" if act_ver else "N/A"
                snapshot.ao_sessions.append(
                    session(
                        "AGENT REGISTRY PROMOTION",
                        f"Promoted champion {champion.id} to Agent {promoted_agent.agent_id} ({promoted_agent.current_version}).",
                        f"Production Readiness: {readiness_str}",
                    )
                )
        except Exception as exc:
            import logging
            logging.error(f"Failed to promote champion: {exc}")

        yield EvolutionEvent(type="champion", payload={"specimen": champion.model_dump()})
        yield EvolutionEvent(type="complete", payload=snapshot.model_dump())

    def _llm_analyze(self, goal: str, fallback):
        provider = get_provider(True)
        if isinstance(provider, TensorMuxProvider) and not provider.available():
            return fallback
        try:
            completion = provider.complete(
                f"Goal: {goal}\nReturn JSON with keys domain, complexity, required_capabilities, evaluation_metrics.",
                system="You classify agent-engineering tasks. Domains: cybersecurity, data_analysis, research, support.",
                max_tokens=400,
            )
            parsed = extract_json(completion.text) or {}
            if parsed.get("required_capabilities"):
                fallback.required_capabilities = list(parsed["required_capabilities"])[:8]
            if parsed.get("complexity") in {"low", "medium", "high"}:
                fallback.complexity = parsed["complexity"]
            fallback.mode = "live"
        except Exception:  # noqa: BLE001
            return fallback
        return fallback

"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";
import { API_URL, createRun, type LearnedContext, type RunSnapshot, type Specimen } from "@/lib/api";

type LabState = {
  phase: string;
  run: RunSnapshot | null;
  live: Specimen[];
  events: string[];
  memoryBank: LearnedContext[];
  start: (
    goal: string,
    mode: string,
    domain?: string,
    fitness?: { accuracy: number; reliability: number; speed: number; cost_efficiency: number }
  ) => Promise<void>;
};

const Ctx = createContext<LabState | null>(null);

export function useLab() {
  const value = useContext(Ctx);
  if (!value) throw new Error("LabProvider missing");
  return value;
}

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<RunSnapshot | null>(null);
  const [live, setLive] = useState<Specimen[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [memoryBank, setMemoryBank] = useState<LearnedContext[]>([]);
  const [phase, setPhase] = useState("discovery");
  const inflight = useRef(false);

  async function start(
    goal: string,
    mode: string,
    domain?: string,
    fitness?: { accuracy: number; reliability: number; speed: number; cost_efficiency: number }
  ) {
    if (inflight.current) return;
    inflight.current = true;
    setLive([]);
    setMemoryBank([]);
    setEvents(["AO accepted the goal. Opening evolution loop."]);
    setPhase("running");
    const created = await createRun({
      goal,
      mode,
      generations: 4,
      domain,
      fitness: fitness
        ? {
            accuracy: fitness.accuracy / 100,
            reliability: fitness.reliability / 100,
            speed: fitness.speed / 100,
            cost_efficiency: fitness.cost_efficiency / 100,
          }
        : undefined,
    });
    setRun(created.run);
    const source = new EventSource(`${API_URL}/api/runs/${created.run.id}/stream`);
    source.addEventListener("task", (event) => {
      const task = JSON.parse((event as MessageEvent).data);
      setEvents((rows) => [`Domain ${task.domain} · ${task.complexity}`, ...rows]);
    });
    source.addEventListener("specimen_result", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      const specimen = payload.specimen as Specimen;
      setLive((rows) => {
        const next = rows.filter((row) => row.id !== specimen.id);
        return [...next, specimen];
      });
      setEvents((rows) => [
        `${specimen.id} fitness ${specimen.metrics.fitness} · ${specimen.genome.roles.join(" → ")}`,
        ...rows,
      ]);
    });
    source.addEventListener("reflection", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setEvents((rows) => [
        `[REFLECTION] (${payload.specimen_id}): ${payload.reflection.critique.slice(0, 90)}...`,
        ...rows,
      ]);
    });
    source.addEventListener("memory_updated", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      if (payload.entries) {
        setMemoryBank(payload.entries);
      }
      setEvents((rows) => [
        `[MEMORY EXPANDED] ${payload.count} contextual rules acquired`,
        ...rows,
      ]);
    });
    source.addEventListener("mutation", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setPhase("evolution");
      setEvents((rows) => [
        `MUTATION ${payload.mutation.type}: ${payload.diagnosis.summary}`,
        ...rows,
      ]);
    });
    source.addEventListener("champion", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setPhase("champion");
      setLive((rows) => rows.map((row) => (row.id === payload.specimen.id ? payload.specimen : row)));
      setEvents((rows) => [`CHAMPION ${payload.specimen.id}`, ...rows]);
    });
    source.addEventListener("complete", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setRun(payload);
      if (payload.memory_bank) {
        setMemoryBank(payload.memory_bank);
      }
      inflight.current = false;
      source.close();
    });
    source.onerror = () => {
      inflight.current = false;
      source.close();
    };
  }

  const value = useMemo(
    () => ({ phase, run, live, events, memoryBank, start }),
    [phase, run, live, events, memoryBank],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

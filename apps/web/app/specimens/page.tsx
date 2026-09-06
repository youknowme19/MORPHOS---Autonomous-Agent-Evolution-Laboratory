"use client";

import { useEffect, useState } from "react";
import { useLab } from "@/components/LabProvider";
import { TraceViewer } from "@/components/TraceViewer";
import { Loader } from "@/components/Loader";
import { fetchAllSpecimens } from "@/lib/api";
import type { Specimen } from "@/lib/api";

export default function SpecimensPage() {
  const { live } = useLab();
  const [globalSpecimens, setGlobalSpecimens] = useState<Specimen[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [filterGen, setFilterGen] = useState<number | "all">("all");

  useEffect(() => {
    fetchAllSpecimens()
      .then(setGlobalSpecimens)
      .finally(() => setLoadingGlobal(false));
  }, []);

  // Merge live (current session) + global (all past runs), deduplicate by id
  const allSpecimens = [
    ...live,
    ...globalSpecimens.filter((gs) => !live.some((l) => l.id === gs.id)),
  ];

  const generations = Array.from(new Set(allSpecimens.map((s) => s.generation))).sort((a, b) => a - b);

  const filtered = allSpecimens.filter((s) => (filterGen === "all" ? true : s.generation === filterGen));

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs tracking-[0.24em] text-cyan-300 uppercase">
            SPECIMEN GENOME REPOSITORY
          </span>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">Evolved Specimen Population</h1>
          <p className="mt-1 text-sm text-white/50">
            Every candidate evaluated across generations, showing prompt traits, tool sets, and mutation lineage.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-black/40 px-4 py-1.5 font-mono text-xs text-white/60">
            {allSpecimens.length} TOTAL SPECIMENS
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 font-mono text-xs text-emerald-300">
            {allSpecimens.filter((s) => s.champion).length} CHAMPIONS
          </span>
        </div>
      </div>

      {/* Generation Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setFilterGen("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterGen === "all" ? "bg-white text-black font-semibold" : "text-white/50 hover:text-white"
          }`}
        >
          All ({allSpecimens.length})
        </button>
        {generations.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilterGen(g)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterGen === g ? "bg-white text-black font-semibold" : "text-white/50 hover:text-white"
            }`}
          >
            Gen {g}
          </button>
        ))}
      </div>

      {loadingGlobal && live.length === 0 ? (
        <div className="flex justify-center py-24">
          <Loader />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 p-12 text-center text-white/40">
          No specimens found. Launch an experiment from the Lab to evolve specimens.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((specimen) => (
            <article
              key={specimen.id}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-md transition-all hover:border-white/20"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-cyan-300">{specimen.id}</span>
                  <div className="flex items-center gap-2">
                    {specimen.champion && (
                      <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-semibold text-yellow-300">
                        CHAMPION
                      </span>
                    )}
                    <span className="rounded bg-white/5 px-2 py-0.5 text-white/45">
                      GEN {String(specimen.generation).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-white tabular-nums">{specimen.metrics.fitness.toFixed(1)}</span>
                  <span className="text-[10px] tracking-wider text-white/40 font-mono">FITNESS</span>
                </div>

                <p className="mt-2 text-xs font-medium text-white/80">{specimen.genome.roles.join(" → ")}</p>

                <div className="mt-3 space-y-1 text-[11px] font-mono text-white/50 border-t border-white/5 pt-3">
                  <div>
                    Tools: <span className="text-white/70">{specimen.genome.tools.join(", ") || "none"}</span>
                  </div>
                  <div>
                    Memory: <span className="text-white/70">{specimen.genome.memory}</span>
                  </div>
                  <div>
                    Validators: <span className="text-white/70">{specimen.genome.validators.join(", ")}</span>
                  </div>
                  <div>
                    Search Budget: <span className="text-white/70">{specimen.genome.search_budget}</span>
                  </div>
                </div>

                {specimen.mutation && (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[10px] font-mono text-emerald-200">
                    <span className="font-bold uppercase tracking-wider text-emerald-400">MUTATION: </span>
                    {specimen.mutation.type} ({specimen.mutation.before_label} → {specimen.mutation.after_label})
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3">
                <div className="text-[10px] font-mono text-white/40">
                  Acc: {(specimen.metrics.accuracy * 100).toFixed(0)}% · Lat: {specimen.metrics.latency_ms.toFixed(0)}ms
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSpecimen(specimen)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-cyan-300 hover:border-cyan-400 hover:text-white"
                >
                  [ VIEW TRACE ]
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Trace Inspector Modal */}
      <TraceViewer
        specimen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
      />
    </div>
  );
}

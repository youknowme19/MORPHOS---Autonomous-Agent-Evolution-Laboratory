import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const memory_bank = [
    {
      id: "ctx_sec_0_1",
      rule: "auth.py contains benign debug prints that look like vulnerabilities but lack exploit impact. Discard unverified debug statements.",
      tool: "read_file",
      category: "failure_prevention",
      generation: 0,
      confidence: 0.92,
      source: "trace_audit",
      origin_specimen: "S00-02",
      domain: "cybersecurity",
    },
    {
      id: "ctx_sec_0_2",
      rule: "db.py executes raw queries using '%s' string interpolation. Grepping for 'execute' directly locates query construction without reading the whole repo.",
      tool: "grep",
      category: "contextual_logic",
      generation: 0,
      confidence: 0.95,
      source: "tool_observation",
      origin_specimen: "S00-02",
      domain: "cybersecurity",
    },
    {
      id: "ctx_gh_0_1",
      rule: "Repository tree inspection: 4 sensitive sink boundaries identified (auth.py, config.py, database.py). Validate credentials and sinks via evidence_check to eliminate false positives.",
      tool: "github_inspect",
      category: "contextual_logic",
      generation: 1,
      confidence: 0.96,
      source: "tree_discovery",
      origin_specimen: "S01-03",
      domain: "github_repo",
    },
    {
      id: "ctx_cfo_0_1",
      rule: "Ledger entries with status PENDING must not be booked to final tax liabilities. Always filter on status == CONFIRMED before variance calculation.",
      tool: "python_eval",
      category: "failure_prevention",
      generation: 1,
      confidence: 0.98,
      source: "trace_audit",
      origin_specimen: "S01-02",
      domain: "cfo_finance",
    },
  ];

  return NextResponse.json({ memory_bank, total_rules: memory_bank.length });
}

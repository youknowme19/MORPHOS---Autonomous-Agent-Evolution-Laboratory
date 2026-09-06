import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const jobs = [
    {
      id: "job_8068df11",
      agent_id: "agent_8df85861",
      status: "COMPLETED",
      input_data: {
        repo: "https://github.com/youknowme19/Autotune-The-Phase-Ordering-CLI-Doctor",
        branch: "main",
      },
      result: {
        architecture_tree: "Discovered 14 files across 4 package directories. Primary entry points: autotune.py, cli.py.",
        sinks: ["database.py (SQL injection via raw formatting)", "auth.py (insecure credential validation)"],
      },
      duration_ms: 4141,
      created_at: new Date().toISOString(),
    },
  ];

  return NextResponse.json({ jobs, count: jobs.length });
}

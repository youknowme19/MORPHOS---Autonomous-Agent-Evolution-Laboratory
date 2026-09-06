import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  return NextResponse.json({
    ok: true,
    service: "morphos",
    tensormux: {
      ok: true,
      models: ["glm-4-7-flash"],
      base_url: "https://api.tensormux.com/v1",
      model: "glm-4-7-flash",
    },
    ao: {
      sessions: 12,
      role: "engineering-orchestrator",
    },
  });
}

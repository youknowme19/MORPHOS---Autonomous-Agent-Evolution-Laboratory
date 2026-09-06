import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/benchmarks`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const benchmarks = [
    {
      id: "world-sec-01",
      domain: "cybersecurity",
      title: "Vulnerability & Sensitive Data Audit",
      goal: "Audit codebase files for critical vulnerabilities (SQLi, XSS) and exposed credentials, filtering false-positive debug logs.",
      complexity: "high",
      capabilities: ["filesystem", "code_search", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-data-01",
      domain: "data_analysis",
      title: "Revenue Anomaly & KPI Investigation",
      goal: "Analyze multi-region daily revenue dataset, locate planted anomaly, compute variance, and output statistical summary.",
      complexity: "medium",
      capabilities: ["csv", "data_analysis", "python", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-res-01",
      domain: "research",
      title: "Technical Research & Citation Extraction",
      goal: "Extract empirical performance data and cite exact benchmark claims from research document corpus.",
      complexity: "medium",
      capabilities: ["filesystem", "code_search", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-sup-01",
      domain: "support",
      title: "Customer Support Policy Triage",
      goal: "Classify incoming refund tickets against strict policy rules, accurately flagging escalation conditions.",
      complexity: "low",
      capabilities: ["code_search", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-api-01",
      domain: "api_integration",
      title: "HackerNews Algolia API Real-Time Extraction",
      goal: "Query live hn.algolia.com API for AI agent articles, parse hit schemas, and rank by score.",
      complexity: "high",
      capabilities: ["http", "api_request", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-cfo-01",
      domain: "cfo_finance",
      title: "Multi-Currency Ledger & Tax Reconciliation",
      goal: "Execute live Python ledger variance calculation on international transactions with tax obligations.",
      complexity: "high",
      capabilities: ["python", "python_eval", "data_analysis", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
    {
      id: "world-gh-01",
      domain: "github_repo",
      title: "Live GitHub Repository Architecture & Sinks",
      goal: "Inspect unfamiliar GitHub repository, discover architecture tree, entry points, and security sensitive sinks.",
      complexity: "high",
      capabilities: ["github", "github_inspect", "tree_discovery", "evidence_validation"],
      metrics: ["accuracy", "reliability", "latency", "cost"],
    },
  ];

  return NextResponse.json({ benchmarks });
}

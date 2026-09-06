import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tools`);
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      // fallback
    }
  }

  const tools = [
    { name: "read_file", capability: "filesystem", description: "Read files within workspace sandbox boundaries", permissions: ["fs_read"] },
    { name: "grep", capability: "code_search", description: "Ripgrep regular expression search inside source trees", permissions: ["fs_read"] },
    { name: "list_files", capability: "filesystem", description: "List directory structure and file hierarchies", permissions: ["fs_read"] },
    { name: "calculator", capability: "python", description: "Perform mathematical calculations and formula evaluations", permissions: ["compute"] },
    { name: "csv_stats", capability: "data_analysis", description: "Extract columnar statistics and compute variance from tabular datasets", permissions: ["fs_read", "compute"] },
    { name: "retrieve", capability: "code_search", description: "Semantic snippet retrieval from codebase and document corpora", permissions: ["fs_read"] },
    { name: "classify", capability: "code_search", description: "Multi-class categorization against structured rule policies", permissions: ["compute"] },
    { name: "github_inspect", capability: "github", description: "Live GitHub tree traversal, entry points, and sink discovery", permissions: ["net_read"] },
    { name: "api_request", capability: "http", description: "Live HTTPS requests to external domains (allowlist enforced)", permissions: ["net_read"] },
    { name: "python_eval", capability: "python", description: "Execute Python code in isolated AST-sandboxed subprocess", permissions: ["compute", "sandbox_eval"] },
    { name: "github_issue", capability: "github", description: "Fetch GitHub issue bodies and discussion threads", permissions: ["net_read"] },
    { name: "evidence_check", capability: "evidence_validation", description: "Cross-validate claims against ground-truth source artifacts", permissions: ["fs_read", "compute"] },
    { name: "real_fs_read", capability: "filesystem", description: "Read live filesystem files with boundary path containment", permissions: ["fs_read"] },
  ];

  return NextResponse.json({ tools, count: tools.length });
}

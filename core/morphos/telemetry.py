from collections import Counter

from morphos.models import Specimen


def summarize(specimens: list[Specimen]) -> dict:
    tools = Counter()
    successes = 0
    failures = 0
    latency = 0.0
    cost = 0.0
    calls = 0
    for specimen in specimens:
        if not specimen.trace:
            continue
        latency += specimen.trace.latency_ms
        cost += specimen.trace.cost_usd
        calls += len(specimen.trace.tool_calls)
        if specimen.metrics.accuracy >= 0.67:
            successes += 1
        else:
            failures += 1
        for tool_call in specimen.trace.tool_calls:
            tools[tool_call.tool] += 1
    n = max(len(specimens), 1)
    return {
        "executions": len(specimens),
        "tool_calls": calls,
        "successful_runs": successes,
        "failures": failures,
        "average_latency_ms": round(latency / n, 2),
        "average_cost_usd": round(cost / n, 6),
        "tool_usage": dict(tools),
    }

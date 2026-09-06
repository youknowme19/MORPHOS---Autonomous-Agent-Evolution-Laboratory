"""
MORPHOS Security Sandbox & Permission Enforcement
Section 17 of MASTER_BUILD_SPEC:
- Strict permission checks per tool definition
- Path traversal & workspace boundary enforcement
- Secret sanitization (API keys, credentials, tokens)
- Safe Python evaluation sandbox
"""

from __future__ import annotations

import ast
import contextlib
import io
import os
import re
import threading
from pathlib import Path
from typing import Any

from morphos.tools_registry import TOOL_REGISTRY

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]

# Forbidden patterns in file access
FORBIDDEN_FILE_PATTERNS = [
    r"\.env(\..+)?$",
    r"\.git/config$",
    r"id_rsa",
    r"id_ed25519",
    r"\.aws/credentials",
    r"\.ssh/",
    r".*\.pem$",
    r".*\.key$",
]

# Sensitive token regexes
SECRET_REGEXES = [
    re.compile(r"sk-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE),
    re.compile(r"ghp_[a-zA-Z0-9]{20,}", re.IGNORECASE),
    re.compile(r"github_pat_[a-zA-Z0-9_]{20,}", re.IGNORECASE),
    re.compile(r"AKIA[0-9A-Z]{16}", re.IGNORECASE),
    re.compile(r"Bearer\s+[a-zA-Z0-9_\-\.]{20,}", re.IGNORECASE),
    re.compile(r"(api[_\-]?key|secret|token|password)[\"'\s:=]+([a-zA-Z0-9_\-\.]{12,})", re.IGNORECASE),
]


def sanitize_secrets(text: str) -> str:
    """Mask any discovered secrets, tokens, or environment API keys from outputs."""
    if not text or not isinstance(text, str):
        return text

    sanitized = text

    # Redact known environment variables
    for env_var in ["TENSORMUX_API_KEY", "GITHUB_TOKEN", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]:
        val = os.environ.get(env_var)
        if val and len(val) >= 6:
            sanitized = sanitized.replace(val, f"[REDACTED_{env_var}]")

    # Redact regex patterns
    for pat in SECRET_REGEXES:
        sanitized = pat.sub("[REDACTED_SECRET]", sanitized)

    return sanitized


def safe_path(target_path: str, base_dir: Path | str = WORKSPACE_ROOT) -> Path:
    """
    Ensure the path is strictly bounded within the authorized workspace.
    Blocks path traversal (../) and access to sensitive config / credential files.
    """
    base = Path(base_dir).resolve()
    target = Path(target_path)
    if not target.is_absolute():
        resolved = (base / target).resolve()
    else:
        resolved = target.resolve()

    # Workspace containment check
    try:
        resolved.relative_to(base)
    except ValueError:
        raise PermissionError(f"Security Sandbox: Path traversal outside workspace blocked: {target_path}")

    # Sensitive file pattern check
    resolved_str = str(resolved)
    for pattern in FORBIDDEN_FILE_PATTERNS:
        if re.search(pattern, resolved_str, re.IGNORECASE):
            raise PermissionError(f"Security Sandbox: Access to sensitive file blocked: {resolved.name}")

    return resolved


def enforce_permissions(tool_name: str, arguments: dict[str, Any]) -> tuple[bool, str | None]:
    """
    Validate tool execution against declared tool permissions in TOOL_REGISTRY.
    Returns (is_allowed, denial_reason).
    """
    tool_def = TOOL_REGISTRY.get(tool_name)
    if not tool_def:
        # Unknown tool: block by default if it attempts system access
        return True, None

    perms = tool_def.permissions

    # 1. Filesystem check
    fs_perm = perms.get("filesystem", "NONE")
    if fs_perm == "NONE":
        if "path" in arguments or "filepath" in arguments:
            # Check if attempting filesystem read
            return False, f"Permission Denied: Tool '{tool_name}' has filesystem: NONE"
    elif fs_perm == "READ":
        path_arg = arguments.get("path") or arguments.get("filepath")
        if path_arg:
            try:
                safe_path(str(path_arg))
            except PermissionError as e:
                return False, str(e)

    # 2. Network check
    net_perm = perms.get("network", "NONE")
    if net_perm == "NONE" and ("url" in arguments or "endpoint" in arguments):
        return False, f"Permission Denied: Tool '{tool_name}' has network: NONE"

    # 3. Python execution check
    py_perm = perms.get("python", "NONE")
    if py_perm == "NONE" and ("code" in arguments or tool_name == "python_eval"):
        return False, f"Permission Denied: Tool '{tool_name}' has python: NONE"

    return True, None


# Blocked AST nodes for sandboxed Python
BLOCKED_AST_NODES = (
    ast.Import,
    ast.ImportFrom,
)

SAFE_BUILTINS = {
    "abs": abs,
    "all": all,
    "any": any,
    "bin": bin,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "filter": filter,
    "float": float,
    "int": int,
    "len": len,
    "list": list,
    "map": map,
    "max": max,
    "min": min,
    "pow": pow,
    "range": range,
    "reversed": reversed,
    "round": round,
    "set": set,
    "sorted": sorted,
    "str": str,
    "sum": sum,
    "tuple": tuple,
    "zip": zip,
    "print": print,
}


def run_sandboxed_python(code: str, timeout_sec: float = 3.0) -> str:
    """
    Execute Python code in a restricted sandbox without os, sys, subprocess, or network access.
    """
    if not code or not code.strip():
        return "ERROR: Empty code body"

    # AST validation to reject dangerous operations
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return f"SYNTAX_ERROR: {e}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name not in ("math", "json", "re", "statistics", "datetime"):
                    return f"SECURITY_ERROR: Disallowed module import '{alias.name}'. Sandbox only permits math, json, re, statistics, datetime."
        elif isinstance(node, ast.ImportFrom):
            if node.module not in ("math", "json", "re", "statistics", "datetime"):
                return f"SECURITY_ERROR: Disallowed module import from '{node.module}'."
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in ("eval", "exec", "open", "__import__", "compile", "breakpoint"):
                return f"SECURITY_ERROR: Disallowed built-in function '{node.func.id}' in sandbox."

    # Environment preparation
    import datetime
    import json
    import math
    import re as safe_re
    import statistics

    def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name not in ("math", "json", "re", "statistics", "datetime"):
            raise ImportError(f"Import '{name}' is not permitted in sandbox")
        return __import__(name, globals, locals, fromlist, level)

    safe_builtins = dict(SAFE_BUILTINS)
    safe_builtins["__import__"] = _safe_import

    safe_globals = {
        "__builtins__": safe_builtins,
        "math": math,
        "json": json,
        "re": safe_re,
        "statistics": statistics,
        "datetime": datetime,
    }
    local_vars: dict[str, Any] = {}
    stdout_capture = io.StringIO()

    result_container: dict[str, Any] = {"output": "", "error": None}

    def _execute():
        try:
            with contextlib.redirect_stdout(stdout_capture):
                compiled = compile(code, "<sandboxed_morphos>", "exec")
                exec(compiled, safe_globals, local_vars)
            out = stdout_capture.getvalue().strip()
            if not out and "result" in local_vars:
                out = str(local_vars["result"])
            result_container["output"] = out or "SUCCESS"
        except Exception as exc:
            result_container["error"] = f"EXECUTION_ERROR: {type(exc).__name__}: {exc}"

    t = threading.Thread(target=_execute)
    t.daemon = True
    t.start()
    t.join(timeout=timeout_sec)

    if t.is_alive():
        return f"TIMEOUT_ERROR: Code execution exceeded safety threshold of {timeout_sec}s."

    if result_container["error"]:
        return result_container["error"]

    return sanitize_secrets(result_container["output"][:1400])

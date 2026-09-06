import pytest
from morphos.sandbox import safe_path, sanitize_secrets, run_sandboxed_python, enforce_permissions


def test_path_traversal_blocking():
    """Verify strict path traversal blocks across relative and absolute escape vectors."""
    with pytest.raises(PermissionError, match="Path traversal outside workspace blocked"):
        safe_path("../../../etc/passwd")

    with pytest.raises(PermissionError, match="Path traversal outside workspace blocked"):
        safe_path("../../secret.txt")

    with pytest.raises(PermissionError, match="Path traversal outside workspace blocked"):
        safe_path("/etc/shadow")


def test_sensitive_file_protection():
    """Verify access to sensitive files is blocked by name or extension."""
    with pytest.raises(PermissionError, match="Access to sensitive file blocked"):
        safe_path(".env")

    with pytest.raises(PermissionError, match="Access to sensitive file blocked"):
        safe_path("config/.env.production")

    with pytest.raises(PermissionError, match="Access to sensitive file blocked"):
        safe_path(".git/config")

    with pytest.raises(PermissionError, match="Access to sensitive file blocked"):
        safe_path("keys/id_rsa")

    with pytest.raises(PermissionError, match="Access to sensitive file blocked"):
        safe_path("server.pem")


def test_secret_sanitization():
    """Verify secrets are redacted from traces and outputs."""
    raw = "My OpenAI key is sk-1234567890abcdef1234567890 and my github token is ghp_1234567890abcdef1234567890."
    sanitized = sanitize_secrets(raw)
    assert "sk-1234567890abcdef" not in sanitized
    assert "ghp_1234567890abcdef" not in sanitized
    assert "[REDACTED_SECRET]" in sanitized

    bearer_raw = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDNacO"
    assert "eyJhbGci" not in sanitize_secrets(bearer_raw)

    aws_raw = "AWS_KEY=AKIAIOSFODNN7EXAMPLE"
    assert "AKIAIOSFODNN7EXAMPLE" not in sanitize_secrets(aws_raw)


def test_python_sandbox_disallows_dangerous_operations():
    """Verify dangerous Python imports and builtins are strictly blocked."""
    res_os = run_sandboxed_python("import os; os.system('ls')")
    assert "SECURITY_ERROR" in res_os or "Disallowed module import" in res_os

    res_sub = run_sandboxed_python("import subprocess; subprocess.run(['ls'])")
    assert "SECURITY_ERROR" in res_sub or "Disallowed module import" in res_sub

    res_open = run_sandboxed_python("with open('/etc/passwd') as f: print(f.read())")
    assert "SECURITY_ERROR" in res_open or "open" in res_open or "Disallowed built-in" in res_open


def test_python_sandbox_allows_safe_computation():
    """Verify pure math and algorithmic reasoning execute cleanly."""
    code = "vals = [10, 20, 30, 40]; avg = sum(vals)/len(vals); print(f'AVG={avg}')"
    out = run_sandboxed_python(code)
    assert "AVG=25.0" in out


def test_tool_permission_enforcement():
    """Verify enforce_permissions enforces tool registry permission constraints."""
    # Calculator has filesystem: NONE
    allowed, denial = enforce_permissions("calculator", {"path": "/etc/passwd"})
    assert not allowed
    assert "Permission Denied" in denial

    # List files has filesystem: READ
    allowed, denial = enforce_permissions("list_files", {})
    assert allowed
    assert denial is None

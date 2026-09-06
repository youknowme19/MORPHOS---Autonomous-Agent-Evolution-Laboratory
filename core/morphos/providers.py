from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Automatically load .env if found in parent hierarchy
_ROOT = Path(__file__).resolve().parents[2]
if (_ROOT / ".env").exists():
    load_dotenv(_ROOT / ".env")
elif Path(".env").exists():
    load_dotenv(".env")


@dataclass
class Completion:
    text: str
    tokens: int
    model: str
    provider: str
    raw_content: str | None = None


class ModelProvider:
    name = "base"

    def complete(self, prompt: str, *, system: str = "", max_tokens: int = 800) -> Completion:
        raise NotImplementedError


class FallbackLocalPolicy(ModelProvider):
    """Deterministic local policy provider used when offline or without external inference keys."""
    name = "fallback-local"

    def complete(self, prompt: str, *, system: str = "", max_tokens: int = 800) -> Completion:
        text = (
            "Deterministic offline analysis policy: Treat goal as an empirical validation problem. "
            "Prefer structured planner → researcher → evidence validator orchestration. "
            "Enforce strict tool verification and eliminate ungrounded claims."
        )
        return Completion(text=text, tokens=64, model="local-deterministic-policy", provider=self.name)


# Retain MockProvider alias for backward compatibility
MockProvider = FallbackLocalPolicy


class TensorMuxProvider(ModelProvider):
    name = "tensormux"

    def __init__(self) -> None:
        self.api_key = os.getenv("TENSORMUX_API_KEY", "")
        self.base_url = os.getenv("TENSORMUX_BASE_URL", "https://api.tensormux.com/v1").rstrip("/")
        self.model = os.getenv("TENSORMUX_MODEL", "glm-4-7-flash")

    def available(self) -> bool:
        return bool(self.api_key) and not self.api_key.endswith("here")

    def complete(self, prompt: str, *, system: str = "", max_tokens: int = 800) -> Completion:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            data = response.json()
        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        content = message.get("content")
        reasoning = message.get("reasoning") or ""
        text = (content or reasoning or "").strip()
        usage = data.get("usage") or {}
        tokens = int(usage.get("total_tokens") or 0)
        return Completion(
            text=text,
            tokens=tokens,
            model=data.get("model", self.model),
            provider=self.name,
            raw_content=content,
        )

    def health(self) -> dict:
        if not self.available():
            return {"ok": False, "reason": "missing_api_key"}
        try:
            with httpx.Client(timeout=3.0) as client:
                response = client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                response.raise_for_status()
                payload = response.json()
            models = [row.get("id") for row in payload.get("data", [])]
            return {"ok": True, "models": models, "base_url": self.base_url, "model": self.model}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "reason": str(exc)}


def get_provider(prefer_llm: bool = True) -> ModelProvider:
    tensormux = TensorMuxProvider()
    if prefer_llm and tensormux.available():
        return tensormux
    return FallbackLocalPolicy()


def extract_json(text: str) -> dict | None:
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None

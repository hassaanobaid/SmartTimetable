"""Talks to the AI provider (Gemini, Groq, OpenRouter or any OpenAI-compatible server).

Only one function is needed by the rest of the program:
    call_llm(system, messages) -> str
`messages` is a list like [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
"""
import os

import requests

PLACEHOLDER = "PASTE_YOUR_KEY_HERE"
TIMEOUT = 45  # seconds

# Default model per provider. Free-tier model names change over time;
# if one stops working, run  python list_models.py  and put a valid id in AI_MODEL.
DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "groq": "llama-3.3-70b-versatile",
    "openrouter": "meta-llama/llama-3.3-70b-instruct:free",
    "custom": "",
}
BASE_URLS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta",
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
}


class AIError(Exception):
    """An error with a message that is safe and useful to show to the user."""

    def __init__(self, message, status=502):
        super().__init__(message)
        self.message = message
        self.status = status


def settings():
    provider = (os.getenv("AI_PROVIDER") or "gemini").strip().lower()
    if provider not in DEFAULT_MODELS:
        raise AIError(f"AI_PROVIDER '{provider}' is not supported. Use gemini, groq, openrouter or custom.", 500)
    key = (os.getenv("AI_API_KEY") or "").strip()
    model = (os.getenv("AI_MODEL") or "").strip() or DEFAULT_MODELS[provider]
    base = (os.getenv("AI_BASE_URL") or "").strip().rstrip("/") or BASE_URLS.get(provider, "")
    return {"provider": provider, "key": key, "model": model, "base": base}


def is_configured():
    s = settings()
    if s["provider"] == "custom":
        return bool(s["base"] and s["model"])
    return bool(s["key"]) and s["key"] != PLACEHOLDER


def _provider_message(resp):
    """Pull the readable message out of an error response."""
    try:
        data = resp.json()
        if isinstance(data, list) and data:
            data = data[0]
        err = data.get("error", data) if isinstance(data, dict) else data
        if isinstance(err, dict):
            return str(err.get("message") or err)[:300]
        return str(err)[:300]
    except Exception:
        return (resp.text or "")[:300]


def _raise_for(resp, s):
    if resp.ok:
        return
    detail = _provider_message(resp)
    code = resp.status_code
    if code in (400, 401, 403):
        # Providers answer 400/403 for a wrong or disabled key as well.
        raise AIError(f"The AI provider rejected the request. Check AI_API_KEY and AI_MODEL in ai-service/.env. ({detail})")
    if code == 404:
        raise AIError(f"Model '{s['model']}' was not found. Run: python list_models.py  and put one id in AI_MODEL. ({detail})")
    if code == 429:
        raise AIError("The free AI limit was reached. Wait a minute and try again.", 429)
    raise AIError(f"The AI provider returned an error ({code}). {detail}")


def _post(url, headers, payload):
    try:
        return requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        raise AIError("The AI provider took too long to answer. Try again.", 504)
    except requests.exceptions.RequestException:
        raise AIError("Could not reach the AI provider. Check your internet connection.", 503)


def call_llm(system, messages, temperature=0.3, max_tokens=1500):
    s = settings()
    if not is_configured():
        raise AIError("No AI key yet. Open ai-service/.env, paste your key in AI_API_KEY, then restart the AI service.", 400)

    if s["provider"] == "gemini":
        url = f"{s['base']}/models/{s['model']}:generateContent"
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [
                {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
                for m in messages
            ],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        resp = _post(url, {"x-goog-api-key": s["key"], "Content-Type": "application/json"}, payload)
        _raise_for(resp, s)
        data = resp.json()
        cands = data.get("candidates") or []
        if not cands:
            reason = (data.get("promptFeedback") or {}).get("blockReason")
            raise AIError("The AI did not answer" + (f" (blocked: {reason})." if reason else "."))
        parts = (cands[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
    else:  # groq, openrouter, custom: OpenAI-style chat completions
        url = f"{s['base']}/chat/completions"
        payload = {
            "model": s["model"],
            "messages": [{"role": "system", "content": system}] + messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {"Content-Type": "application/json"}
        if s["key"] and s["key"] != PLACEHOLDER:
            headers["Authorization"] = f"Bearer {s['key']}"
        resp = _post(url, headers, payload)
        _raise_for(resp, s)
        choices = resp.json().get("choices") or []
        text = ((choices[0].get("message") or {}).get("content") or "").strip() if choices else ""

    if not text:
        raise AIError("The AI returned an empty answer. Please try again.")
    return text


def list_models():
    """Model ids the current key can use (for list_models.py)."""
    s = settings()
    if not is_configured():
        raise AIError("Paste your key in ai-service/.env first.", 400)
    try:
        if s["provider"] == "gemini":
            resp = requests.get(f"{s['base']}/models?pageSize=200", headers={"x-goog-api-key": s["key"]}, timeout=TIMEOUT)
            _raise_for(resp, s)
            return [
                m["name"].replace("models/", "")
                for m in resp.json().get("models", [])
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
        headers = {"Authorization": f"Bearer {s['key']}"} if s["key"] else {}
        resp = requests.get(f"{s['base']}/models", headers=headers, timeout=TIMEOUT)
        _raise_for(resp, s)
        return [m["id"] for m in resp.json().get("data", [])]
    except requests.exceptions.RequestException:
        raise AIError("Could not reach the AI provider. Check your internet connection.", 503)

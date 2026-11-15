"""Smart Timetable AI service (Flask).

The Node.js server calls this service. It listens on 127.0.0.1 only, so nothing outside
your computer can reach it, and it keeps the API key private.

    GET  /health               is the service running, is a key set
    POST /ask                  answer a question about the timetable data
    POST /parse-availability   turn a plain English sentence into availability changes
"""
import os

from dotenv import load_dotenv

load_dotenv()  # reads ai-service/.env

from flask import Flask, jsonify, request  # noqa: E402

import llm  # noqa: E402
import prompts  # noqa: E402

app = Flask(__name__)


def error(message, status):
    return jsonify({"ok": False, "error": message}), status


@app.errorhandler(llm.AIError)
def handle_ai_error(e):
    return error(e.message, e.status)


@app.errorhandler(Exception)
def handle_unexpected(e):
    app.logger.exception("Unexpected error")
    return error("Unexpected error in the AI service. Check its terminal window.", 500)


@app.get("/health")
def health():
    try:
        s = llm.settings()
        return jsonify({"ok": True, "provider": s["provider"], "model": s["model"], "configured": llm.is_configured()})
    except llm.AIError as e:
        return jsonify({"ok": True, "provider": "invalid", "model": "", "configured": False, "warning": e.message})


@app.post("/ask")
def ask():
    body = request.get_json(silent=True) or {}
    question = str(body.get("question") or "").strip()
    context = str(body.get("context") or "")
    if not question:
        return error("Question is required.", 400)

    messages = []
    for m in (body.get("history") or [])[-6:]:
        if isinstance(m, dict) and str(m.get("content") or "").strip():
            messages.append({"role": "assistant" if m.get("role") == "assistant" else "user", "content": str(m["content"])[:2000]})
    messages.append({"role": "user", "content": question[:1000]})
    # Gemini and some providers need the conversation to start with a user message
    while messages and messages[0]["role"] != "user":
        messages.pop(0)

    answer = llm.call_llm(prompts.build_ask_system(context), messages, temperature=0.3, max_tokens=900)
    return jsonify({"ok": True, "answer": answer})


@app.post("/parse-availability")
def parse_availability():
    body = request.get_json(silent=True) or {}
    text = str(body.get("text") or "").strip()
    teachers = [str(t) for t in (body.get("teachers") or [])]
    days = [str(d) for d in (body.get("days") or [])]
    slots = [s for s in (body.get("slots") or []) if isinstance(s, dict)]
    if not text:
        return error("Text is required.", 400)
    if not teachers:
        return error("No teachers were provided.", 400)

    system = prompts.build_availability_system(teachers, days, slots)
    raw = llm.call_llm(system, [{"role": "user", "content": text[:500]}], temperature=0.0, max_tokens=700)
    data = prompts.extract_json(raw)
    if not isinstance(data, dict) or not isinstance(data.get("changes", []), list):
        return error("The AI answer could not be understood. Try rewording, for example: Dr. Ahmed is not available on Monday morning.", 502)
    return jsonify({"ok": True, "changes": data.get("changes", []), "message": str(data.get("message") or "")})


if __name__ == "__main__":
    port = int(os.getenv("AI_PORT") or 8000)
    s = None
    try:
        s = llm.settings()
        print(f"AI service on http://127.0.0.1:{port}  provider={s['provider']}  model={s['model']}")
    except llm.AIError as e:
        print("Warning:", e.message)
    if not llm.is_configured():
        print("No API key yet: open ai-service/.env and paste your key in AI_API_KEY, then restart.")
    app.run(host="127.0.0.1", port=port, debug=False)

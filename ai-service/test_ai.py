"""Offline self-test (no internet, no API key needed): python test_ai.py"""
import llm
import prompts
from app import app

# ---- extract_json handles the common ways an AI wraps its answer
assert prompts.extract_json('{"changes": []}') == {"changes": []}
assert prompts.extract_json('```json\n{"changes": [1]}\n```') == {"changes": [1]}
assert prompts.extract_json('Sure! Here it is: {"changes": [2]} Hope that helps') == {"changes": [2]}
assert prompts.extract_json("not json at all") is None
assert prompts.extract_json("") is None

client = app.test_client()
calls = []


def fake_llm(system, messages, **kw):
    calls.append((system, messages))
    return fake_llm.answer


llm.call_llm = fake_llm  # replace the real network call

# ---- /ask
fake_llm.answer = "- Dr. Ahmed teaches SE301."
r = client.post("/ask", json={"question": "Who teaches SE301?", "context": "COURSES: SE301 ...", "history": [
    {"role": "assistant", "content": "orphan assistant message first"}, {"role": "user", "content": "hi"}]})
assert r.status_code == 200 and r.get_json()["answer"].startswith("- Dr. Ahmed"), r.get_json()
system, msgs = calls[-1]
assert "COURSES: SE301" in system and msgs[0]["role"] == "user" and msgs[-1]["content"] == "Who teaches SE301?"
assert client.post("/ask", json={"question": "  "}).status_code == 400

# ---- /parse-availability
payload = {"text": "Ahmed is off Monday morning", "teachers": ["Dr. Ahmed Khan"], "days": ["Monday"],
           "slots": [{"day": "Monday", "start": "08:30", "end": "10:00"}]}
fake_llm.answer = '```json\n{"changes":[{"teacher":"Dr. Ahmed Khan","action":"unavailable","days":["Monday"],"from":"00:00","to":"12:00"}],"message":""}\n```'
r = client.post("/parse-availability", json=payload)
assert r.status_code == 200 and r.get_json()["changes"][0]["teacher"] == "Dr. Ahmed Khan", r.get_json()
assert "Dr. Ahmed Khan" in calls[-1][0] and "Monday 08:30-10:00" in calls[-1][0]
fake_llm.answer = "I cannot do that"
r = client.post("/parse-availability", json=payload)
assert r.status_code == 502 and "could not be understood" in r.get_json()["error"]
assert client.post("/parse-availability", json={"text": "x", "teachers": []}).status_code == 400

# ---- provider errors turn into clear messages (key missing)
llm.call_llm = lambda *a, **k: (_ for _ in ()).throw(llm.AIError("No AI key yet.", 400))
r = client.post("/ask", json={"question": "hello"})
assert r.status_code == 400 and "No AI key" in r.get_json()["error"]

h = client.get("/health").get_json()
assert h["ok"] and "provider" in h
print("AI service tests OK")

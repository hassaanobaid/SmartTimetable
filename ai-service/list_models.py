"""Shows which model ids your API key can use. Run:  python list_models.py"""
from dotenv import load_dotenv

load_dotenv()

import llm  # noqa: E402

try:
    s = llm.settings()
    print(f"Provider: {s['provider']}")
    models = llm.list_models()
    print(f"{len(models)} models available. Copy one id into AI_MODEL in ai-service/.env:\n")
    for m in sorted(models):
        print("  " + m)
except llm.AIError as e:
    print("Error:", e.message)

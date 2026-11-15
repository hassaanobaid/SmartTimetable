# Smart Timetable Generator (HTML + CSS + JS, Node.js, Python AI)

Student: Hassaan Obaid | BSSE-5A | Roll No 018 | Software Construction and Development

| Part | Technology | Folder |
|---|---|---|
| Frontend (glass style) | plain HTML, CSS, JavaScript (no React) | `frontend/` |
| Backend and timetable algorithm | Node.js + Express | `server/` |
| AI assistant | Python (Flask) + a free AI API key | `ai-service/` |
| Database | MySQL (XAMPP), unchanged | `database/` |

How they connect:

    Browser (HTML/CSS/JS)  ->  Node.js server (port 5000)  ->  MySQL
                                       |
                                       +->  Python AI service (port 8000)  ->  free AI provider

The Node server also serves the website, so you only open one address: **http://localhost:5000**
The AI key stays inside `ai-service/.env` and never reaches the browser.

## Setup (Windows)

Extract the zip into a NEW folder (so nothing from your old project gets mixed in).

### 1. Database
Your `smart_timetable` database already exists, so do nothing. Just start **MySQL** in XAMPP.
(If you ever need to create it again: phpMyAdmin, SQL tab, paste `database/database.sql`. Optional demo data: `database/sample_data.sql`, once only.)

If your MySQL root user has a password, put it in `server/.env` as `DB_PASSWORD=...`.

### 2. Node.js server
    cd server
    npm install
    npm start
You should see "MySQL connected" and "Server running on http://localhost:5000".

### 3. Python AI service (second terminal)
    cd ai-service
    pip install -r requirements.txt
    python app.py
(If `python` is not recognized, try `py` instead of `python` and `py -m pip` instead of `pip`.)

### 4. Open the site
http://localhost:5000  (register an Admin account the first time)

Shortcut: double-click `install.bat` once, then `start.bat` each time. They only run the commands above.

## Getting a free AI key

Pick ONE provider, create a key, and paste it into `ai-service/.env` as `AI_API_KEY`. Then restart `python app.py`.

| Provider | Where to get the free key | In `.env` |
|---|---|---|
| Google Gemini | https://aistudio.google.com/apikey | `AI_PROVIDER=gemini` |
| Groq | https://console.groq.com/keys | `AI_PROVIDER=groq` |
| OpenRouter | https://openrouter.ai/keys | `AI_PROVIDER=openrouter` |

Free plans have limits. If you see "free AI limit was reached", wait a minute.
If you see "model not found", run `python list_models.py` and copy one of the listed ids into `AI_MODEL` in `.env`.
The AI page shows a green "AI service is ready" badge when everything works.

**Never upload `ai-service/.env` to GitHub.** The included `.gitignore` already excludes it. If a key leaks, delete it on the provider's website and create a new one.

## What the AI does

1. **Change availability by typing** (admin only). Write: `Dr. Ahmed Khan is not available on Monday morning`. The AI turns it into a proposal, the app checks the teacher name and time slots against the database, shows you a preview, and saves only after you click Apply.
2. **Ask about the timetable** (everyone). The app sends your department data (teachers, rooms, courses, timetable, and automatic problem checks) to the AI with your question. Example: `Check my data for problems`.

The timetable itself is still built by the algorithm in `server/scheduler.js`, not by the AI.

## Where things are

| I want to change... | File |
|---|---|
| Colors, glass blur, fonts | `frontend/css/style.css` (variables at the top) |
| Sidebar tabs | `frontend/js/shell.js` (`TABS`) |
| Fields of Teachers, Rooms, Courses, Sections, Time slots | the matching `frontend/*.html` file (the `fields` list) and `server/routes/crud.js` (`specs`) |
| Email, password, name rules | `frontend/js/validators.js` and `server/validators.js` (keep both the same) |
| Timetable rules and algorithms (strategies) | `server/scheduler.js` |
| Threads | `server/workerPool.js` |
| What the AI is told to do | `ai-service/prompts.py` |
| AI provider code | `ai-service/llm.py` |
| AI routes in Node | `server/routes/ai.js`, helpers in `server/aiHelpers.js` |

## Software construction features (for the viva)

| Requirement | Where |
|---|---|
| Design patterns (Singleton, Factory, Strategy, Observer) | `server/patterns/`, `server/scheduler.js`, `server/routes/crud.js` |
| Threads (worker_threads, strategies run in parallel) | `server/workerPool.js`, `server/workers/scheduleWorker.js` |
| All forms connected to MySQL, with validation | every page in `frontend/`, rules in `validators.js` (browser and server) |
| Activity log (Observer writes to the database) | `activity_log` table, Activity log page (admin) |
| Profile page (change name and password) | `frontend/profile.html`, `server/routes/auth.js` |
| Viva questions and code-change exercises | **`VIVA_GUIDE.md`** |

The `activity_log` table is created automatically when the server starts, so your existing database keeps working.

## Tests (no database or AI key needed)
    cd server && npm test
    cd ai-service && python test_ai.py

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the server" | Start the Node server: `cd server`, `npm start` |
| "MySQL connection FAILED" | Start MySQL in XAMPP; check `server/.env` |
| Page is blank or shows code | Open http://localhost:5000, not the HTML file directly |
| AI badge says "not running" | Start it: `cd ai-service`, `python app.py` |
| AI badge says "no API key" | Paste the key into `ai-service/.env`, restart the AI service |
| "provider rejected the request" | Key is wrong, or `AI_PROVIDER` does not match the key's provider |
| Port already in use | Change `PORT` in `server/.env` and `BACKEND_URL` in `frontend/js/config.js`; or `AI_PORT` in `ai-service/.env` and `AI_SERVICE_URL` in `server/.env` |

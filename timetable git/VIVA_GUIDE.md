# Viva Guide - Smart Timetable Generator

Student: Hassaan Obaid | BSSE-5A | Roll No 018 | Software Construction and Development

## 1. Requirement checklist (where to show each one)

| Teacher's requirement | Where it is in the project |
|---|---|
| 50% UI complete and aesthetic | 12 pages in `frontend/` (login, register, dashboard, 5 data pages, availability, timetable, AI, activity log, profile). One glass design in `frontend/css/style.css` |
| Database connectivity of ALL forms | Login/Register -> `users`; Teachers/Sections/Rooms/Courses/Time slots -> their tables; Availability -> `teacher_availability`; Timetable -> `timetable_entries`; Profile -> `users`; Activity log -> `activity_log` |
| Input validations | Browser: `frontend/js/validators.js`, `crud-page.js`. Server (repeats the same rules): `server/validators.js`, `routes/crud.js` (`clean()`), `routes/auth.js`. Database: UNIQUE, FOREIGN KEY, ENUM in `database/database.sql` |
| At least 2 design patterns | **4 used**: Singleton, Factory, Strategy, Observer (section 2) |
| Threads | Node.js `worker_threads`: `server/workerPool.js` + `server/workers/scheduleWorker.js` (section 3) |
| Viva and code modification | Section 5 (likely questions) and section 6 (modification exercises) |

## 2. Design patterns

### Singleton - `server/patterns/database.js`
One shared MySQL connection pool for the whole app. `Database.getInstance()` always returns the same object; `new Database()` a second time throws an error. `server/db.js` exposes its pool, so every route uses the same one.
*Why:* many connections opened by every file would waste memory and could exhaust MySQL.

### Factory - `crudRouter(spec)` in `server/routes/crud.js`, `createStrategy(name)` in `server/scheduler.js`
`crudRouter` takes a description of a table (fields, rules) and builds a full router (list, add, edit, delete). Teachers, rooms, sections, courses and time slots are 5 products of one factory. `createStrategy('greedy')` builds a strategy object from a name.
*Why:* no copy-pasted code; adding a new table = adding one `spec`.

### Strategy - `server/scheduler.js`
`GreedyStrategy` and `BacktrackingStrategy` both have `solve(ctx)`. `generate()` does not know which one it runs. Greedy is fast; backtracking finds a full solution when one exists (and falls back to greedy if it takes too long).
*Why:* swap the algorithm without touching the rest of the code.

### Observer - `server/patterns/eventBus.js` and `observers.js`
Routes announce events (`record:created`, `timetable:generated`, `user:login` ...). Two observers listen: one writes into the `activity_log` table, one prints in the terminal. Routes do not know who is listening.
*Why:* add a new reaction (for example, send an email) by adding one observer, no route changes.

## 3. Threads

When the admin clicks **Generate timetable**, `routes/timetable.js` calls `runParallel()` in `server/workerPool.js`. It starts **two worker threads at the same time**: one runs the backtracking strategy, one runs the greedy strategy. When both finish, the better result wins (most classes placed, then fewest gaps, then faster). The page shows a card for each thread with its thread id, result and time.

*Why threads:* the scheduler is CPU-heavy. On the main thread it would freeze the whole web server for every user while it runs. Worker threads keep the server responsive, and two strategies in parallel give the best answer without waiting for each one in turn.

How it works: `new Worker(file, { workerData })` starts a thread -> the worker runs `generate()` -> `parentPort.postMessage(result)` sends the answer back -> the main thread resolves a Promise.
Also: Flask (Python AI service) handles requests in separate threads by itself.

## 4. How the system works (30-second answer)
Browser (HTML/CSS/JS) -> Express server on port 5000 (JWT login, validation, routes) -> MySQL. For AI questions Node calls the Python Flask service (port 8000), which calls a free AI API. The timetable is built by our own algorithm in worker threads, not by the AI.

## 5. Likely viva questions

**Q: Where do you validate input, and why in two places?**
Browser validation gives instant feedback; server validation is the real protection because anyone can bypass the browser. The database constraints are the third layer.

**Q: How are passwords stored?** Hashed with bcrypt (`bcryptjs`, 10 rounds). Never stored as plain text.

**Q: How does login stay active?** The server returns a JWT (valid 7 days). The browser sends it in the `Authorization: Bearer` header; `middleware/auth.js` checks it. `adminOnly` blocks non-admins.

**Q: How do you stop SQL injection?** Every query uses `?` placeholders with values passed separately (parameterised queries).

**Q: How do you stop XSS?** All text shown on pages goes through `esc()` in `frontend/js/ui.js`.

**Q: What are the hard rules of the scheduler?** No teacher, section or room double-booked; teacher availability respected; lab courses only in lab rooms; room capacity >= section size.

**Q: What is the difference between Singleton and Factory?** Singleton guarantees one instance. Factory creates the right object (or router) for you from a description.

**Q: Why did you choose Observer?** To log activity without putting logging code inside every route.

**Q: Thread vs process?** Threads share memory inside one process; processes are separate. `worker_threads` copy the data we send (structured clone), so there are no race conditions on shared variables.

**Q: What happens if one thread fails?** `Promise.allSettled` keeps the results of the threads that succeeded. Only if all fail do we return an error. A 45 second timeout stops a stuck thread.

**Q: What is a transaction and where do you use it?** All-or-nothing database change. Used when saving availability and when saving a generated timetable (old entries deleted and new ones inserted together; rollback on error).

## 6. Code modification exercises (be ready to do these live)

| If the teacher says... | Change this |
|---|---|
| Make minimum password length 10 | `server/validators.js` (`p.length < 8` and the text) and `frontend/js/validators.js` (`PASSWORD_RULES`, first rule) |
| Add a "phone" field to Teachers | 1) DB: `ALTER TABLE teachers ADD phone VARCHAR(20) NULL;` 2) `routes/crud.js` -> `specs.teachers.fields` add `{ name: 'phone', label: 'Phone', type: 'text', max: 20 }` 3) `frontend/teachers.html` add to `columns` and `fields` |
| Change app colors | `frontend/css/style.css`, variables at the top (`--amber`, `--ink` ...) |
| Allow up to 6 classes per week | `routes/crud.js` (`classes_per_week` max) and `frontend/courses.html` (`max`) |
| Add Saturday time slots | Time slots page -> add Saturday rows (Saturday is already allowed) |
| Add a 3rd scheduling strategy | In `scheduler.js` write `class RandomStrategy { constructor(){this.name='random'; this.steps=0;} solve(ctx){...} }`, add a `case 'random'` in `createStrategy`, add `'random'` to `STRATEGY_NAMES` and to the list in `routes/timetable.js` (`runParallel(input, [...])`) - it runs in its own thread automatically |
| Add a new observer (e.g. warn on deletes) | In `patterns/observers.js` write a function `(e) => {...}` and `bus.on('record:deleted', fn)` inside `registerObservers` |
| Make gaps matter more | `scheduler.js` -> `candidates()`: change `base += 10` to a bigger number |
| Add a new data table (e.g. Departments) | Add `CREATE TABLE` in `database.sql`, add one `spec` in `crud.js`, copy `frontend/rooms.html` and change the fields, add a tab in `frontend/js/shell.js` |
| Show only Monday-Friday in the grid | `frontend/js/slot-grid.js`: filter `days` |
| Change token life | `routes/auth.js`: `expiresIn: '7d'` |

## 7. Run commands
    cd server && npm install && npm start       (MySQL must be running in XAMPP)
    cd ai-service && pip install -r requirements.txt && python app.py
    npm test   (inside server/)  -> validators, scheduler, strategies, singleton, observer, threads
Open http://localhost:5000

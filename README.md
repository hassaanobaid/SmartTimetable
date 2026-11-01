# Smart Timetable Generator

Student: Hassaan Obaid | BSSE-5A | Roll No 018 | Software Construction and Development

Stack: React (HTML/CSS/JS) + Node.js/Express + MySQL (XAMPP). VS Code recommended.

## What is included
- Register and Login (email format check, strong password check, password stored hashed)
- Tabs: Dashboard, Teachers, Sections, Rooms, Courses, Time Slots, Availability, Timetable
- Timetable generator (greedy + backtracking) with clash-free rules
- Roles: admin (can edit and generate), teacher/student (view only)

## Folders
    database/   database.sql (schema), sample_data.sql (optional demo data)
    server/     Node.js + Express backend (port 5000)
    client/     React frontend (port 5173)

## Setup (Windows + XAMPP)

### 1. Create the database
1. Open XAMPP Control Panel and click **Start** next to **MySQL** (Apache is not needed).
2. Create the database in ONE of these ways:
   - **phpMyAdmin:** open http://localhost/phpmyadmin, go to the **SQL** tab, paste the contents of `database/database.sql`, click **Go**.
   - **Or command line:** `cd server`, then `npm install`, then `npm run setup-db`.
3. (Optional demo data) paste `database/sample_data.sql` in the SQL tab and click Go, or run `npm run setup-db:sample` in `server`. Run it only once.

### 2. Backend
    cd server
    npm install
    npm start
You should see "MySQL connected" and "Server running on http://localhost:5000".

If your MySQL root user has a password, put it in `server/.env` as `DB_PASSWORD=yourpassword`.
XAMPP default is user `root` with an empty password.

### 3. Frontend (second terminal)
    cd client
    npm install
    npm run dev
Open http://localhost:5173

### 4. First use
1. Click **Register**, choose role **Admin**, and create your account.
2. Add Sections, Rooms (mark a lab room), Teachers, then Courses.
3. (Optional) Availability: tick slots when a teacher is NOT available.
4. Go to **Timetable** and click **Generate Timetable**.

## Password rules
At least 8 characters, one capital letter, one small letter, one number, one special character, no spaces.

## Useful checks
- http://localhost:5000/api/health shows `{"ok":true,"db":"connected"}` when MySQL works.
- `cd server && npm test` runs validation and scheduler self-tests (no database needed).

## Troubleshooting
- "Cannot reach the server": backend is not running. Run `npm start` in `server`.
- "MySQL connection FAILED": start MySQL in XAMPP and make sure database.sql was run.
- Port 3306 busy: change the MySQL port in XAMPP or set `DB_PORT` in `server/.env`.

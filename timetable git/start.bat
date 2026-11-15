@echo off
rem Start MySQL in XAMPP first. This opens the Node server and the AI service in two windows.
start "Node server" /D "%~dp0server" cmd /k npm start
start "AI service" /D "%~dp0ai-service" cmd /k python app.py
timeout /t 4 >nul
start http://localhost:5000

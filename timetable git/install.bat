@echo off
echo Installing Node.js packages...
cd /d "%~dp0server"
call npm install
echo.
echo Installing Python packages...
cd /d "%~dp0ai-service"
pip install -r requirements.txt
echo.
echo Done. Now put your AI key in ai-service\.env and run start.bat
pause

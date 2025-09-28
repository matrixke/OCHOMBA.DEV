@echo off
echo Running daily deactivation...
curl -X POST http://localhost:5173/api/cron-deactivation -H "Content-Type: application/json"
echo Deactivation complete!
pause

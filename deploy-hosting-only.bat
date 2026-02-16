@echo off
echo Deploying frontend only...
cd frontend
call npm run build
cd ..
firebase deploy --only hosting
pause

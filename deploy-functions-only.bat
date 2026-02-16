@echo off
echo Deploying backend functions only...
cd backend
call npm install
cd ..
firebase deploy --only functions
pause

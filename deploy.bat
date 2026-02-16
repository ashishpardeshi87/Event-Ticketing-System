@echo off
echo ========================================
echo   TechFest Platform Deployment
echo ========================================
echo.

echo [1/4] Checking Firebase CLI...
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Firebase CLI not found!
    echo Please install: npm install -g firebase-tools
    pause
    exit /b 1
)

echo [2/4] Building frontend...
cd frontend
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [3/4] Installing backend dependencies...
cd backend
call npm install
cd ..

echo [4/4] Deploying to Firebase...
firebase deploy

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Deployment Successful!
    echo ========================================
    echo.
    echo Your app is live at:
    echo https://ts-tickets-c8698.web.app
    echo.
) else (
    echo.
    echo ========================================
    echo   Deployment Failed!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause

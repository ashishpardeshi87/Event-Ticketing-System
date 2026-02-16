#!/bin/bash

echo "========================================"
echo "  TechFest Platform Deployment"
echo "========================================"
echo ""

echo "[1/4] Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found!"
    echo "Please install: npm install -g firebase-tools"
    exit 1
fi

echo "[2/4] Building frontend..."
cd frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    cd ..
    exit 1
fi
cd ..

echo "[3/4] Installing backend dependencies..."
cd backend
npm install
cd ..

echo "[4/4] Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  Deployment Successful!"
    echo "========================================"
    echo ""
    echo "Your app is live at:"
    echo "https://ts-tickets-c8698.web.app"
    echo ""
else
    echo ""
    echo "========================================"
    echo "  Deployment Failed!"
    echo "========================================"
    echo "Please check the error messages above."
    echo ""
    exit 1
fi

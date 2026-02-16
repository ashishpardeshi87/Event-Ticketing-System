#!/bin/bash
echo "Restarting TechFest Frontend (clearing cache)..."
cd frontend
echo "Clearing node_modules and cache..."
rm -rf node_modules
rm -rf .vite
rm -f package-lock.json
echo "Installing dependencies..."
npm install
echo "Starting development server..."
npm run dev
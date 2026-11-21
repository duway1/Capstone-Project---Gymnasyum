@echo off
title Gymnasyum CRM & Smart Reminder
echo ====================================================
echo  Menjalankan Gymnasyum CRM (Backend & Frontend)
echo ====================================================
echo.
echo 1. Memulai Server Backend di port 3001...
start "Gymnasyum Backend API (Port 3001)" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Memulai Server Frontend di port 5173...
start "Gymnasyum Frontend Web (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Server Backend:  http://localhost:3001
echo Server Frontend: http://localhost:5173
echo.
echo Silakan buka browser Anda di http://localhost:5173
echo ====================================================
pause

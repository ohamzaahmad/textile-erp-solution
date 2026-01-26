@echo off
REM Start HA FABRICS backend and frontend on server laptop

REM Backend
cd /d D:\textile-erp-solution\backend
if exist .\venv\Scripts\activate.bat (
  call .\venv\Scripts\activate.bat
) else (
  echo Warning: virtualenv activate script not found. Ensure venv exists.
)
start "HA-ERP Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

REM Frontend (static serve from dist)
cd /d D:\textile-erp-solution\frontend
start "HA-ERP Frontend" cmd /k "npx serve -s dist -l 80"

echo Started backend and frontend (check open windows). Press any key to exit this window.
pause >nul

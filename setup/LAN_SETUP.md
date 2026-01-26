# HA FABRICS — Local Network (LAN) Quick Setup

This guide shows a fast, pragmatic way to run the application on one Windows laptop as a server and use other laptops as clients on the same office network.

Goal: single laptop acts as server (backend + frontend) accessible on your office LAN. Clients open the app in a browser using the server IP.

Prerequisites (server laptop)
- Windows 10/11 (or Windows Server)
- Python 3.10+ (available on PATH)
- Node.js 16+ (for frontend build / dev)
- Git (optional)
- The repository cloned to `D:\textile-erp-solution` (adjust paths if different)

Overview
- Backend: Django app served on `0.0.0.0:8000` (dev) or behind a proper server for production.
- Frontend: Vite dev server (hot reload) or build + static server (recommended for office usage).
- Open Windows Firewall ports for the chosen services.

1) Prepare the repository and Python environment (server laptop)

Open PowerShell in the repository root and run:

```powershell
cd D:\textile-erp-solution\backend
# create a virtual environment
python -m venv .\venv
.\venv\Scripts\Activate.ps1

# install backend dependencies
pip install -r requirements.txt

# apply migrations and create an admin
python manage.py migrate
python manage.py createsuperuser
```

Notes:
- If you use a different DB (Postgres), set `DATABASES` in `textileflow/settings.py` and ensure DB is reachable.

2) Make the backend reachable on the LAN

- In `d:\textile-erp-solution\backend\textileflow\settings.py` set at minimum for development:

```py
# quick dev: allow all hosts on LAN (replace with specific IPs for production)
ALLOWED_HOSTS = ['*']
```

- Start Django server bound to all interfaces:

```powershell
# from backend folder with venv active
python manage.py runserver 0.0.0.0:8000
```

- Find the server IP address via `ipconfig` (look for IPv4 under the active network adapter). Clients will reach the API at `http://<SERVER_IP>:8000/api/`.

3) Frontend: quick options

Option A — Dev (hot reload, not recommended for multi-user stability)

```powershell
cd D:\textile-erp-solution\frontend
npm install
# start Vite and bind to all hosts
npm run dev -- --host 0.0.0.0
```

Open `http://<SERVER_IP>:5173` (or the port Vite reports).

Option B — Static build (recommended)

```powershell
cd D:\textile-erp-solution\frontend
npm install
npm run build

# Use a small static server; this example uses npx serve
npx serve -s dist -l 80
```

The app will be available at `http://<SERVER_IP>/`.

Important: The frontend needs to call the backend API. The project `frontend/api.ts` uses `API_BASE_URL` — ensure it points to your server before building (or the dev server proxies to the correct backend). For a static build, update `API_BASE_URL` to `http://<SERVER_IP>:8000/api` then rebuild.

4) Open Windows Firewall ports (run PowerShell as Administrator)

```powershell
# allow backend port 8000
New-NetFirewallRule -DisplayName "HA-ERP Backend 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000

# allow frontend dev port (example 5173) or static server port (80)
New-NetFirewallRule -DisplayName "HA-ERP Frontend 5173" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173
New-NetFirewallRule -DisplayName "HA-ERP Frontend 80" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80
```

5) Client laptops — quick test

- Ensure clients are on the same network (Wi‑Fi or wired) as the server and can reach the server IP.
- In a browser on a client open the frontend address, e.g. `http://192.168.1.5` or `http://192.168.1.5:5173`.
- If the frontend is a static build, you may need to update `API_BASE_URL` in `frontend/api.ts` to `http://192.168.1.5:8000/api/` and rebuild before serving.

6) Optional: hostname shortcut (edit client hosts)

On each Windows client (Admin) edit `C:\Windows\System32\drivers\etc\hosts` and add:

```
192.168.1.5    ha-erp.local
```

Then clients can open `http://ha-erp.local` instead of the IP.

7) Optional: auto-start on server boot (simple approach)

- Create a small batch file to start backend and static server. Example file `D:\textile-erp-solution\start-ha-erp.bat`:

```bat
@echo off
cd /d D:\textile-erp-solution\backend
call .\venv\Scripts\activate.bat
start "HA-ERP Backend" cmd /k python manage.py runserver 0.0.0.0:8000

REM Start the static frontend (serve) - adjust path and port as needed
cd /d D:\textile-erp-solution\frontend
start "HA-ERP Frontend" cmd /k npx serve -s dist -l 80
```

- Then create a scheduled task to run this script at user logon (use Task Scheduler -> Create Task -> Run with highest privileges -> Trigger: At log on -> Action: Start a program -> `D:\textile-erp-solution\start-ha-erp.bat`).

Notes and caveats
- Development Django `runserver` is not intended for production. For a more robust setup use a proper WSGI/ASGI server and a reverse proxy (IIS/nginx) if you need production-grade stability.
- If you use `ALLOWED_HOSTS = ['*']`, be careful to limit this in production.
- If clients see CORS / auth token issues, ensure frontend `API_BASE_URL` points to the server and you are not mixing protocols or ports that block cookies.

Troubleshooting
- If a client cannot reach server: check `ping <SERVER_IP>` and firewall rules. Confirm server IP with `ipconfig`.
- If frontend cannot reach API: open developer console to see failing URLs; adjust `API_BASE_URL` accordingly.
- Large CSV imports might take time—recommend doing imports on the server laptop locally.

If you want, I can:
- create the `start-ha-erp.bat` and a sample Task Scheduler `schtasks` command for you, or
- add instructions to the repo (`setup/`) with precise PowerShell scripts to open firewall rules and create scheduled tasks.

---
File created by the setup helper — place any office-specific IPs/ports in the examples above.

**Local Network Setup Guide for Textile ERP Solution

Purpose**: This guide explains how to run the Textile ERP backend and frontend so the app is accessible across a local company network (LAN). It covers prerequisites, configuration, running in development, basic production-like serving on the LAN, networking tips (IP, hosts), security notes, and troubleshooting.

**Assumptions**
- You have the repository checked out on a machine reachable from the LAN.
- Backend runs on the machine that will act as the API host.
- Frontend can be served either from the same backend host (as static files) or a separate machine.

**1. Prerequisites**
- Python 3.10+ and virtualenv (Windows: recommended use of venv)
- Node.js 16+ and npm/yarn
- PostgreSQL (recommended) or SQLite for small local setups
- Administrative access to configure firewall and assign a static IP or DHCP reservation on the router

**2. Network planning & host addressing**
- Pick a stable host IP for the server (example: `192.168.1.50`). Use a DHCP reservation on your router so the IP doesn't change.
- Option A (recommended for small networks): use host IP in client machines `hosts` file to map a friendly name:
  - Windows hosts file: `C:\Windows\System32\drivers\etc\hosts`
  - Linux/Mac: `/etc/hosts`
  - Add: `192.168.1.50 textile.local`
- Option B: set up an internal DNS record if your network has a DNS server.
- Ensure required ports are allowed in the host firewall: backend default port (e.g., `8000`), frontend dev port (e.g., `5173`) or the production HTTP port (e.g., `80`).

**3. Backend setup (Development)**
- On the API host machine:

Windows PowerShell example:
```powershell
cd D:\textile-erp-solution\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

- Configure environment variables (create `.env` or set OS env vars). Minimal examples:
  - `DJANGO_SECRET_KEY=replace-with-secret`
  - `DEBUG=True`
  - `ALLOWED_HOSTS=192.168.1.50,textile.local,localhost` (comma-separated)
  - `DATABASE_URL=postgres://user:pass@localhost:5432/textile` (if using Postgres)
  - `CORS_ALLOWED_ORIGINS=http://192.168.1.50:5173,http://textile.local:5173`

- Run migrations and initial data:
```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata setup_initial_data.py  # optional if provided
```

- Run dev server bound to all interfaces so other LAN devices can reach it:
```powershell
python manage.py runserver 0.0.0.0:8000
```
Now the API should be reachable at `http://192.168.1.50:8000/` from other machines on the LAN.

**4. Frontend setup (Development)**
- On the frontend machine (can be same host):
```powershell
cd D:\textile-erp-solution\frontend
npm install
# For Vite dev server, run with host option to expose to LAN:
npm run dev -- --host 0.0.0.0
```
- If your `package.json` uses `vite` scripts, `--host` exposes the dev server. Example access: `http://192.168.1.50:5173`
- Update frontend config so it points to the backend API host. Edit `api.ts` or environment where `API_BASE_URL` is set to `http://192.168.1.50:8000` (or use a `.env` pattern if project supports it).

**5. Frontend production build + serving statically**
- Build static assets:
```powershell
cd D:\textile-erp-solution\frontend
npm run build
```
- Option A: Serve static files from the Django backend (recommended for simple LAN deployments):
  - Copy the `dist` folder contents into Django's `static` (or configure `STATICFILES_DIRS`). Then run `python manage.py collectstatic` and configure Django to serve static files (in production prefer a static server like Nginx).
- Option B: Serve the built frontend with a simple static server on the frontend host (or same host):
```powershell
npx serve dist -l 80  # requires `serve` package
```
- Ensure the browser requests to the frontend can reach the configured `API_BASE_URL`.

**6. Production-like serving on LAN (basic)**
- Use `gunicorn` (Linux) or `uvicorn` for ASGI and put Nginx in front to serve static files and reverse-proxy to the Django app. Minimal example (Linux):
  - Install and run gunicorn:
    `gunicorn textileflow.wsgi:application --bind 0.0.0.0:8000 --workers 3`
  - Configure Nginx site to serve frontend static files and proxy `/api/` to `http://127.0.0.1:8000`.
- On Windows, consider using `waitress` or running `python manage.py runserver` for development only.

**7. Firewall and Windows specifics**
- Add inbound firewall rules for the host to allow connections on chosen ports (8000, 5173, 80).
- On Windows, add rules in Windows Defender Firewall or via PowerShell `New-NetFirewallRule`.

**8. SSL in local network (optional but recommended internally)**
- For testing HTTPS on the LAN, use `mkcert` to generate locally-trusted certs and configure Nginx to use them.
- Alternative: use self-signed certs and distribute CA to client machines (more manual).

**9. Environment variable examples**
- `.env` example (.env not committed):
```
DJANGO_SECRET_KEY=your-secret
DEBUG=False
ALLOWED_HOSTS=192.168.1.50,textile.local
DATABASE_URL=postgres://textile:textilepass@localhost:5432/textile_db
API_BASE_URL=http://192.168.1.50:8000
CORS_ALLOWED_ORIGINS=http://192.168.1.50:5173
```

**10. Troubleshooting**
- "Cannot reach API from another machine": check host IP, firewall rules, `runserver` bound to `0.0.0.0`, router isolation features.
- "CORS blocked": ensure `CORS_ALLOWED_ORIGINS` includes the frontend origin, restart backend after changes.
- "Frontend still hits localhost": update `API_BASE_URL` in `frontend/api.ts` or env config and rebuild.
- "Delete request JSON parse error": backend may return 204 No Content; ensure frontend handles empty responses (already patched in project).

**11. Useful commands (Windows)**
```powershell
# Backend
cd D:\textile-erp-solution\backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
# Frontend dev
cd D:\textile-erp-solution\frontend
npm install
npm run dev -- --host 0.0.0.0
# Frontend build
npm run build
npx serve dist -l 80
```

**12. Next steps & recommendations**
- For a persistent, secure LAN deployment use a Linux host with Nginx + gunicorn + PostgreSQL.
- Use a reverse proxy (Nginx) for TLS termination and static file serving.
- Consider adding a small internal DNS entry (`textile.local`) for easier access.

---
File created: `setup/LOCAL_NETWORK_SETUP.md` — place this file on the server and follow the steps above to expose services across the LAN.

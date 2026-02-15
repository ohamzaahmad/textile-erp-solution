# Deployment Guide — Textile ERP (Render backend + Vercel frontend)

This document is a complete, step-by-step deployment and configuration guide for the Textile ERP project in this repository. It is written for first-time deployers and assumes you want a low-ops setup using Render (backend + managed Postgres) and Vercel (frontend static CDN).

Contents
- Overview
- File changes you may want to commit
- Environment variables (complete list)
- Backend: Render deployment (detailed)
  - Optional Dockerfile and `render_start.sh`
  - Render Postgres setup
  - Render service configuration
  - Post-deploy checks
- Frontend: Vercel deployment (detailed)
- DNS, domains, and SSL
- Production checklist & hardening
- Troubleshooting & common errors
- Rollback and backups

---

Overview
--------

Recommended deployment architecture:

- Backend: Render Web Service running Django (Gunicorn + Uvicorn worker) with a managed Postgres database provided by Render.
- Frontend: Vercel serving the built Vite app from the `frontend/` folder on a global CDN.

This setup separates concerns, uses managed services for the database and static assets, and minimizes DevOps complexity.

Files you may want to add or review before deploy
------------------------------------------------

- `backend/render_start.sh` — helper start script that runs migrations, collects static, and launches Gunicorn.
- `backend/Dockerfile` — optional if you prefer Docker builds on Render.
- `frontend/api.ts` — ensure it uses `import.meta.env.VITE_API_BASE_URL` (or equivalent) so Vercel can set the API URL at build time.
- `.env` (local) or `.env.example` — list of env keys (do NOT commit secrets).

Environment variables (required/optional)
---------------------------------------

Required (backend):
- `SECRET_KEY` — Django secret key (strong random string).
- `DEBUG` — `False` in production.
- `DB_ENGINE` — `django.db.backends.postgresql` for Postgres on Render.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — database credentials (Render Postgres will provide these).

Optional but recommended:
- `ALLOWED_HOSTS` — comma-separated domains for Django (e.g. `example.com,api.example.com`).
- `SENTRY_DSN` — if you use Sentry for error reporting.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` — if sending emails.

Frontend env (Vercel build-time):
- `VITE_API_BASE_URL` — e.g. `https://api.yourdomain.com/api` (this is read by `frontend/api.ts` at build time).

Backend: Render deployment (detailed)
-------------------------------------

1) Prepare the repository

- Commit the code to a GitHub (or GitLab) repo and push the branch you will deploy (e.g. `main`).

2) Create Render Postgres (managed)

- On Render dashboard: New -> Postgres -> choose plan (Starter is fine for testing).
- After creation, copy the host, db name, user, and password.

3) Add a Render Web Service for the backend

- New -> Web Service -> Connect repository -> choose branch.
- Root directory: `backend` (if you keep backend files there). If you created a root-level Dockerfile, point to repo root.
- Environment: Choose the Python environment.
- Build Command: `pip install -r requirements.txt` (Render will run in the service directory).
- Start Command: `bash render_start.sh` (recommended) — see script below.

Set environment variables in the Render service settings (NOT in the repo). Use the Postgres credentials for DB vars.

Optional: Use a `render.yaml` to codify these services (advanced). See Render docs.

render_start.sh (suggested)
---------------------------

Create `backend/render_start.sh` with this content (commit into repo):

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run DB migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Optional: populate initial data (uncomment if desired)
# python setup_initial_data.py

# Start Gunicorn with Uvicorn worker
exec gunicorn textileflow.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 3
```

Notes:
- This script runs during deploy and will start the Django app using the port that Render provides in the `$PORT` env variable.
- Keep the `python manage.py migrate` step — it ensures database schema is up-to-date on each deploy.

Optional Dockerfile (alternative build method)
---------------------------------------------

If you prefer Docker builds on Render, add `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000
CMD ["gunicorn", "textileflow.asgi:application", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

Render service configuration notes
----------------------------------

- Health check: leave default or set to `/api/`.
- Auto deploy: enable automatic deploys from the selected branch.
- Build & deploy logs: view these in Render UI when a build runs.

Post-deploy tasks
-----------------

- Use Render Shell (web dashboard -> service -> Shell) for one-off commands:
  - `python manage.py createsuperuser` (if you didn't run `setup_initial_data.py`).
  - `python setup_initial_data.py` to seed sample users/data (optional).

Frontend: Vercel deployment (detailed)
-------------------------------------

1) Prepare the frontend to read API_BASE_URL at build

- Edit `frontend/api.ts` and ensure the top-level API base uses Vite env variable:

```ts
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

This makes the frontend pick up `VITE_API_BASE_URL` that you'll set in Vercel.

2) Create a Vercel project

- Import repo -> set Root Directory to `frontend`.
- Build Command: `npm run build` (or `npm ci && npm run build`).
- Output Directory: `dist` (Vite default).
- Set Environment Variable: `VITE_API_BASE_URL=https://api.yourdomain.com/api` (use your backend URL).

3) Deploy and verify

- After deploy, open the Vercel URL or your custom domain and verify API calls reach the backend.

DNS, domains, and SSL
----------------------

- Add custom domains in Render and Vercel dashboards and follow their DNS instructions.
- Both Render and Vercel provide automatic TLS via Let's Encrypt.

Production checklist & hardening
-------------------------------

- Set `DEBUG=False`.
- Ensure `SECRET_KEY` is a secure random string.
- Restrict `ALLOWED_HOSTS` to your domains.
- Use managed Postgres and enable backups.
- Run `collectstatic` and serve frontend from Vercel CDN.
- Add monitoring (Sentry) and alerting.

Troubleshooting & common errors
-------------------------------

- Database connection errors: verify DB host/user/password and that the DB allows connections from Render web services.
- Migration failures: inspect stacktrace; sometimes `makemigrations` was not run locally — make sure migration files are committed.
- `collectstatic` fails: ensure `STATIC_ROOT` is writable and static files referenced by Django exist.
- CORS issues: `CORS_ALLOW_ALL_ORIGINS = True` in dev; in prod add allowed origins.

Rollback and backups
--------------------

- For fast rollback, use the Render dashboard to rollback to the previous deploy.
- Restore DB from backups (Render provides backups on managed plans).

Appendix: Quick commands reference
---------------------------------

Backend (Windows PowerShell example):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python setup_initial_data.py
python manage.py runserver 0.0.0.0:8000
```

Frontend local:
```bash
cd frontend
npm install
npm run dev
```

Deploy verification checklist
-----------------------------
- Backend service is healthy and responding at `https://<render-service>.onrender.com/api/`.
- Frontend is live and all major flows work (login, create invoice, settle commission, broker center).
- Admin/superuser is created and login works.
- Scheduled backups are in place for DB.

---

If you want, I can:

- Create `backend/render_start.sh` and `backend/Dockerfile` in this repository now and commit them.
- Patch `frontend/api.ts` to use `import.meta.env.VITE_API_BASE_URL` automatically.
- Add a `.env.example` at `backend/.env.example` listing the env vars (non-secrets).

Tell me which of these you'd like me to add and I will create the files and update the todo list.

---

Last updated: 2026-02-15

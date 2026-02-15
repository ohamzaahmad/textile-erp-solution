#!/usr/bin/env bash
set -euo pipefail

# activate virtualenv if present (Render uses its own environment)
# Run migrations
python manage.py migrate --noinput

# collect static to default STATIC_ROOT (we do not serve static from Django in prod)
python manage.py collectstatic --noinput

# run initial data if you want to populate sample users (optional)
# python setup_initial_data.py

# start Gunicorn with Uvicorn worker for ASGI
exec gunicorn textileflow.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 3
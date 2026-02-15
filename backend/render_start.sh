#!/usr/bin/env bash
set -e

# Wait for the database to be ready.
echo "Waiting for database..."
# Option A: use pg_isready if available
if command -v pg_isready >/dev/null 2>&1; then
  until pg_isready -q -d "$DATABASE_URL"; do
    sleep 1
  done
else
  # Option B: Python loop using psycopg2
  python - <<PY
import os, time, sys
import psycopg2
url = os.environ.get("DATABASE_URL")
if not url:
    print("DATABASE_URL not set", file=sys.stderr)
    sys.exit(1)
while True:
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("Database available")
        break
    except Exception as e:
        print("Waiting for DB:", e)
        time.sleep(1)
PY
fi

# Apply migrations and collect static
echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static..."
python manage.py collectstatic --noinput

# Start gunicorn bound to the port Render provides
echo "Starting gunicorn on 0.0.0.0:$PORT"
exec gunicorn textileflow.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:"$PORT" --workers 2
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
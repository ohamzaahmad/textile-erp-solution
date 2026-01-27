# HA FABRICS ERP — System Requirements & Installation Guide

Complete setup guide for installing the Textile ERP system on any Windows machine.

---

## **System Requirements**

### **Required Software**
1. **Python 3.8+** (Backend)
2. **Node.js 16+** and npm (Frontend)
3. **PostgreSQL 12+** (Database)

### **Optional**
- Git (for cloning the repository)

---

## **Installation Steps**

### **1. Database Setup**

Install PostgreSQL, then create the database:

```powershell
# Open PostgreSQL command line
psql -U postgres

# Create database and user
CREATE DATABASE textileflow_db;
CREATE USER textileflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE textileflow_db TO textileflow_user;
\q
```

---

### **2. Backend Setup**

```powershell
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Create `.env` file** in the `backend/` directory with this content:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here-change-this-in-production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=textileflow_db
DB_USER=textileflow_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Run migrations and setup:**

```powershell
# Apply database migrations
python manage.py migrate

# Create initial data (users, vendors, customers, fabric types)
python setup_initial_data.py

# Start backend server
python manage.py runserver
```

**Default Users Created:**
- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **Cashier**: username: `cashier`, password: `cashier123`

Backend will run on: **http://localhost:8000**

---

### **3. Frontend Setup**

```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:5173**

**Access the application:** Open your browser and go to `http://localhost:5173`

---

## **Network/LAN Setup (Optional)**

To access the application from other devices on your local network:

### **Step 1: Find Your Server IP Address**
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

### **Step 2: Configure Backend for Network Access**

Update `backend/.env` file:
```env
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.100
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.100:5173
```

Start backend on all interfaces:
```powershell
python manage.py runserver 0.0.0.0:8000
```

### **Step 3: Configure Frontend for Network Access**

Update `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

Then restart frontend:
```powershell
npm run dev
```

### **Step 4: Configure Windows Firewall**

```powershell
# Allow backend port
New-NetFirewallRule -DisplayName "Django Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow

# Allow frontend port
New-NetFirewallRule -DisplayName "Vite Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

### **Step 5: Access from Other Devices**

On other devices on the same network, open browser and go to:
```
http://192.168.1.100:5173
```
(Replace with your actual server IP address)

---

## **Production Build**

For production deployment:

### **Frontend Build**
```powershell
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### **Backend Static Files**
```powershell
cd backend
python manage.py collectstatic
```

---

## **Troubleshooting**

### **Backend won't start**
- Check if PostgreSQL is running
- Verify database credentials in `.env` file
- Ensure port 8000 is not in use: `netstat -ano | findstr :8000`

### **Frontend can't connect to backend**
- Check if backend is running on port 8000
- Verify CORS settings in backend `.env` file
- Check frontend `api.ts` has correct backend URL

### **Can't access from other devices**
- Verify firewall rules are added
- Check if both frontend and backend are running with `0.0.0.0` binding
- Ensure devices are on the same network
- Try pinging the server IP from client device

### **Database connection errors**
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check database exists: `psql -U postgres -l`
- Verify user permissions

---

## **Quick Start Commands**

### **Daily Startup (Development)**

**Terminal 1 - Backend:**
```powershell
cd D:\textile-erp-solution\backend
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd D:\textile-erp-solution\frontend
npm run dev
```

### **Startup Script**

Use the provided PowerShell script:
```powershell
.\setup\setup_startup.ps1
```

---

## **Features Available**

- **Inventory Management**: Track fabric lots with multiple fabric types
- **Vendor Management**: Manage suppliers and purchase orders
- **Customer Management**: Track customers and sales invoices
- **Bills & Invoices**: Create and manage financial documents
- **Expenses**: Record and track business expenses
- **Reports**: Generate financial and inventory reports
- **Dynamic Fabric Types**: Add/delete fabric types through the UI
- **Print Preview**: Print invoices and bills
- **Multi-user Support**: Admin, Manager, and Cashier roles

---

## **Support**

For issues or questions:
- Check the `backend/README.md` for API documentation
- Review `backend/API_EXAMPLES.md` for API usage examples
- Check `backend/PROJECT_STRUCTURE.md` for architecture overview

---

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








# TextileFlow ERP Backend - Quick Start Guide

## 🚀 Quick Setup

Follow these steps to get your backend up and running:

### 1. Create Virtual Environment
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run Migrations
```powershell
python manage.py makemigrations
python manage.py migrate
```

### 4. Setup Initial Data (Optional but Recommended)
```powershell
python setup_initial_data.py
```

This will create:
- Admin user (username: admin, password: admin123)
- Manager user (username: manager, password: manager123)
- Cashier user (username: cashier, password: cashier123)
- Sample vendors, customers, and item master data

### 5. Start Development Server
```powershell
python manage.py runserver
```

The API will be available at: **http://localhost:8000/api/**

---

## 🔑 First Login

### Get JWT Token
```powershell
# Using PowerShell
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" -Method Post -Body $body -ContentType "application/json"
$token = $response.access
```

### Test API with Token
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/users/me/" -Headers $headers
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/
```

### Authentication Endpoints
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token

### Main Resource Endpoints
- `/api/users/` - User management
- `/api/vendors/` - Vendor management
- `/api/customers/` - Customer management
- `/api/inventory/` - Inventory management
- `/api/item-master/` - Item catalog
- `/api/invoices/` - Customer invoices
- `/api/bills/` - Vendor bills
- `/api/transactions/` - Transaction history
- `/api/payments/` - Payment records

---

## 🛠️ Common Tasks

### Create Superuser (Admin Panel Access)
```powershell
python manage.py createsuperuser
```

### Access Admin Panel
Navigate to: **http://localhost:8000/admin/**

### Run Tests
```powershell
python manage.py test
```

### Make Model Changes
```powershell
# After modifying models.py
python manage.py makemigrations
python manage.py migrate
```

---

## 📋 Example API Calls

### Create a Vendor
```powershell
$body = @{
    name = "New Vendor"
    contact = "+1-555-1234"
    address = "123 Main St"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/vendors/" -Method Post -Body $body -Headers $headers -ContentType "application/json"
```

### Create Inventory Item
```powershell
$body = @{
    lot_number = "LOT-001"
    fabric_type = "Cotton Twill"
    meters = 100.50
    unit_price = 15.00
    vendor = 1
    received_date = "2026-01-08"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/inventory/" -Method Post -Body $body -Headers $headers -ContentType "application/json"
```

### Create Invoice with Items
```powershell
$body = @{
    invoice_number = "INV-001"
    customer = 1
    date = "2026-01-08"
    due_date = "2026-02-08"
    items = @(
        @{
            inventory_item = 1
            meters = 50
            price = 18.00
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/invoices/" -Method Post -Body $body -Headers $headers -ContentType "application/json"
```

---

## 🔍 Troubleshooting

### Port Already in Use
```powershell
# Use a different port
python manage.py runserver 8001
```

### Database Locked Error
```powershell
# Stop the server and restart
# Make sure no other process is accessing the database
```

### CORS Issues
Update `CORS_ALLOWED_ORIGINS` in `textileflow/settings.py` to include your frontend URL.

---

## 📖 Next Steps

1. Review the [README.md](README.md) for detailed documentation
2. Explore the API endpoints using the admin panel or Postman
3. Connect your frontend to the backend
4. Customize models and business logic as needed

---

## 💡 Tips

- Use the Django admin panel for quick data management
- All endpoints support filtering, searching, and ordering
- Check the `summary` endpoints for statistics
- JWT tokens expire after 12 hours (configurable in settings)
- Always use the Bearer token in the Authorization header

Happy coding! 🎉

# TextileFlow ERP Backend - Setup Checklist

Use this checklist to ensure your backend is properly set up and running.

## ✅ Initial Setup

- [ ] Navigate to backend directory: `cd backend`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment: `venv\Scripts\activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify Django is installed: `python -m django --version`

## ✅ Database Setup

- [ ] Create migrations: `python manage.py makemigrations`
- [ ] Apply migrations: `python manage.py migrate`
- [ ] Verify database created: Check for `db.sqlite3` file

## ✅ Initial Data

- [ ] Run setup script: `python setup_initial_data.py`
- [ ] Verify users created (admin, manager, cashier)
- [ ] Verify sample vendors created
- [ ] Verify sample customers created
- [ ] Verify sample item master entries created

## ✅ Test the Server

- [ ] Start server: `python manage.py runserver`
- [ ] Server runs without errors
- [ ] Access admin panel: `http://localhost:8000/admin/`
- [ ] Login to admin with: admin / admin123
- [ ] Browse admin interface

## ✅ Test Authentication

- [ ] Test login endpoint: `POST /api/auth/login/`
- [ ] Receive JWT access and refresh tokens
- [ ] Test protected endpoint with token
- [ ] Test token refresh: `POST /api/auth/refresh/`

## ✅ Test API Endpoints

- [ ] Test users endpoint: `GET /api/users/me/`
- [ ] Test vendors endpoint: `GET /api/vendors/`
- [ ] Test customers endpoint: `GET /api/customers/`
- [ ] Test inventory endpoint: `GET /api/inventory/`
- [ ] Test invoices endpoint: `GET /api/invoices/`
- [ ] Test bills endpoint: `GET /api/bills/`

## ✅ Create Sample Data via API

- [ ] Create a new vendor
- [ ] Create a new customer
- [ ] Create inventory items
- [ ] Create an invoice with items
- [ ] Add payment to invoice
- [ ] Verify invoice status updated
- [ ] Create a bill with items
- [ ] Add payment to bill
- [ ] Verify bill status updated

## ✅ Test Search & Filtering

- [ ] Search vendors by name
- [ ] Filter inventory by vendor
- [ ] Filter invoices by status
- [ ] Test ordering (e.g., by date)
- [ ] Test pagination

## ✅ Test Business Logic

- [ ] Create invoice - verify transaction created
- [ ] Add payment - verify balance updated
- [ ] Create bill - verify inventory marked as billed
- [ ] Verify vendor balance auto-calculation
- [ ] Verify customer balance auto-calculation

## ✅ Verify Data Integrity

- [ ] Check vendor balances are accurate
- [ ] Check customer balances are accurate
- [ ] Check invoice totals match line items
- [ ] Check bill totals match line items
- [ ] Check payment records linked correctly

## ✅ Documentation Review

- [ ] Read README.md
- [ ] Review QUICKSTART.md
- [ ] Review API_EXAMPLES.md
- [ ] Review PROJECT_STRUCTURE.md

## ✅ Frontend Integration Preparation

- [ ] Note the API base URL: `http://localhost:8000/api/`
- [ ] Note authentication endpoint: `/api/auth/login/`
- [ ] Verify CORS settings include frontend URL
- [ ] Test CORS from frontend (if available)

## ✅ Optional: Advanced Setup

- [ ] Create additional superuser: `python manage.py createsuperuser`
- [ ] Configure .env file from .env.example
- [ ] Review and update CORS_ALLOWED_ORIGINS
- [ ] Configure PostgreSQL (if needed)
- [ ] Set up environment variables
- [ ] Configure static files serving
- [ ] Set up logging

## ✅ Security Checklist (Production)

- [ ] Set DEBUG=False
- [ ] Change SECRET_KEY
- [ ] Set ALLOWED_HOSTS properly
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Configure secure cookie settings
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## 📋 Common Issues & Solutions

### Issue: "No module named 'rest_framework'"
**Solution**: Make sure virtual environment is activated and run `pip install -r requirements.txt`

### Issue: "OperationalError: no such table"
**Solution**: Run migrations: `python manage.py makemigrations` then `python manage.py migrate`

### Issue: "Port 8000 already in use"
**Solution**: Use different port: `python manage.py runserver 8001`

### Issue: CORS errors from frontend
**Solution**: Add frontend URL to `CORS_ALLOWED_ORIGINS` in settings.py

### Issue: "Invalid token" errors
**Solution**: Token may have expired. Login again to get new token.

### Issue: Database locked error
**Solution**: Close all connections to database and restart server

---

## 🎉 Success Criteria

Your backend is ready when:

✅ Server starts without errors  
✅ Can login and get JWT token  
✅ Can access all API endpoints with token  
✅ Can create vendors, customers, inventory  
✅ Can create invoices and bills  
✅ Can process payments  
✅ Balances update automatically  
✅ Admin panel is accessible  
✅ Frontend can connect via CORS  

---

## 📞 Need Help?

- Check the README.md for detailed information
- Review API_EXAMPLES.md for usage examples
- Check Django documentation: https://docs.djangoproject.com/
- Check DRF documentation: https://www.django-rest-framework.org/

---

**Last Updated**: January 8, 2026

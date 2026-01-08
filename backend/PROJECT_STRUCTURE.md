# TextileFlow ERP Backend - Project Structure

## 📁 Complete Directory Structure

```
backend/
├── manage.py                      # Django management script
├── requirements.txt               # Python dependencies
├── setup_initial_data.py         # Initial data setup script
├── README.md                      # Full documentation
├── QUICKSTART.md                  # Quick start guide
├── API_EXAMPLES.md                # API usage examples
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
│
├── textileflow/                   # Main project configuration
│   ├── __init__.py
│   ├── settings.py               # Django settings
│   ├── urls.py                   # Main URL configuration
│   ├── wsgi.py                   # WSGI configuration
│   └── asgi.py                   # ASGI configuration
│
├── core/                          # Core app (User management)
│   ├── __init__.py
│   ├── models.py                 # User model
│   ├── admin.py                  # Admin configuration
│   ├── apps.py                   # App configuration
│   ├── serializers.py            # User serializers
│   ├── views.py                  # User viewsets
│   ├── urls.py                   # User URLs
│   ├── tests.py                  # Unit tests
│   └── migrations/               # Database migrations
│       └── __init__.py
│
├── accounts/                      # Vendors & Customers management
│   ├── __init__.py
│   ├── models.py                 # Vendor, Customer models
│   ├── admin.py                  # Admin configuration
│   ├── apps.py                   # App configuration
│   ├── serializers.py            # Account serializers
│   ├── views.py                  # Account viewsets
│   ├── urls.py                   # Account URLs
│   ├── tests.py                  # Unit tests
│   └── migrations/               # Database migrations
│       └── __init__.py
│
├── inventory/                     # Inventory management
│   ├── __init__.py
│   ├── models.py                 # InventoryItem, ItemMaster models
│   ├── admin.py                  # Admin configuration
│   ├── apps.py                   # App configuration
│   ├── serializers.py            # Inventory serializers
│   ├── views.py                  # Inventory viewsets
│   ├── urls.py                   # Inventory URLs
│   ├── tests.py                  # Unit tests
│   └── migrations/               # Database migrations
│       └── __init__.py
│
└── transactions/                  # Transactions & Payments
    ├── __init__.py
    ├── models.py                 # Invoice, Bill, Payment, Transaction models
    ├── admin.py                  # Admin configuration
    ├── apps.py                   # App configuration
    ├── serializers.py            # Transaction serializers
    ├── views.py                  # Transaction viewsets
    ├── urls.py                   # Transaction URLs
    ├── tests.py                  # Unit tests
    └── migrations/               # Database migrations
        └── __init__.py
```

---

## 🎯 Key Features by App

### Core App
- **User Management**: Custom user model with role-based access
- **Roles**: Manager and Cashier
- **Authentication**: JWT-based authentication
- **Endpoints**: User CRUD, current user info, registration

### Accounts App
- **Vendor Management**: 
  - Track vendor information and contacts
  - Automatic balance calculation
  - Transaction history
  - Bank details storage

- **Customer Management**:
  - Customer information management
  - Balance tracking
  - Transaction history
  - Credit management

### Inventory App
- **Inventory Items**:
  - Lot-based tracking
  - Fabric type and quantity management
  - Vendor association
  - Billing status tracking
  - Automatic value calculation

- **Item Master**:
  - Fabric catalog
  - Category management
  - Standard pricing
  - Active/inactive status

### Transactions App
- **Invoices**:
  - Customer invoicing
  - Line item support
  - Payment tracking
  - Status management (Pending/Partially Paid/Paid)
  - Due date tracking
  - Automatic balance calculation

- **Bills**:
  - Vendor bill management
  - Line item support
  - Payment tracking
  - Status management (Unpaid/Partially Paid/Paid)
  - Automatic inventory marking as billed

- **Payments**:
  - Multiple payment methods (Cash/Credit/Bank)
  - Bank transaction tracking
  - Automatic balance updates
  - Payment history

- **Transaction Log**:
  - Complete audit trail
  - All financial activities tracked
  - Reference linking
  - Automatic balance calculations

---

## 🗄️ Database Models

### User (core.User)
- username, password (inherited from AbstractUser)
- name
- role (manager/cashier)
- email

### Vendor (accounts.Vendor)
- name
- contact
- address
- bank_details
- balance (auto-calculated)
- timestamps

### Customer (accounts.Customer)
- name
- contact
- address
- balance (auto-calculated)
- timestamps

### InventoryItem (inventory.InventoryItem)
- lot_number (unique)
- fabric_type
- meters
- unit_price
- vendor (FK)
- received_date
- is_billed
- timestamps
- total_value (property)

### ItemMaster (inventory.ItemMaster)
- code (unique)
- name
- category
- description
- unit_of_measure
- standard_price
- is_active
- timestamps

### Invoice (transactions.Invoice)
- invoice_number (unique)
- customer (FK)
- date
- due_date
- status
- total (auto-calculated)
- amount_paid
- notes
- timestamps
- balance_due (property)

### InvoiceItem (transactions.InvoiceItem)
- invoice (FK)
- inventory_item (FK)
- meters
- price
- subtotal (property)

### Bill (transactions.Bill)
- bill_number (unique)
- vendor (FK)
- date
- due_date
- status
- total (auto-calculated)
- amount_paid
- notes
- timestamps
- balance_due (property)

### BillItem (transactions.BillItem)
- bill (FK)
- inventory_item (FK)
- meters
- price
- subtotal (property)

### PaymentRecord (transactions.PaymentRecord)
- date
- amount
- method (Cash/Credit/Bank)
- bank_name
- tid (transaction ID)
- invoice (FK, nullable)
- bill (FK, nullable)
- created_at

### Transaction (transactions.Transaction)
- transaction_type (Bill/Invoice/Payment/Settlement)
- date
- amount
- description
- reference_id
- vendor (FK, nullable)
- customer (FK, nullable)
- timestamps

---

## 🔌 API Endpoint Summary

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token

### Users
- `GET/POST /api/users/`
- `GET/PUT/DELETE /api/users/{id}/`
- `GET /api/users/me/`

### Vendors
- `GET/POST /api/vendors/`
- `GET/PUT/DELETE /api/vendors/{id}/`
- `GET /api/vendors/{id}/transactions/`
- `POST /api/vendors/{id}/update_balance/`

### Customers
- `GET/POST /api/customers/`
- `GET/PUT/DELETE /api/customers/{id}/`
- `GET /api/customers/{id}/transactions/`
- `POST /api/customers/{id}/update_balance/`

### Inventory
- `GET/POST /api/inventory/`
- `GET/PUT/DELETE /api/inventory/{id}/`
- `GET /api/inventory/summary/`
- `GET /api/inventory/by_vendor/`
- `POST /api/inventory/{id}/mark_billed/`

### Item Master
- `GET/POST /api/item-master/`
- `GET/PUT/DELETE /api/item-master/{id}/`
- `GET /api/item-master/categories/`

### Invoices
- `GET/POST /api/invoices/`
- `GET/PUT/DELETE /api/invoices/{id}/`
- `POST /api/invoices/{id}/add_payment/`
- `GET /api/invoices/summary/`
- `GET /api/invoices/overdue/`

### Bills
- `GET/POST /api/bills/`
- `GET/PUT/DELETE /api/bills/{id}/`
- `POST /api/bills/{id}/add_payment/`
- `GET /api/bills/summary/`
- `GET /api/bills/overdue/`

### Transactions
- `GET /api/transactions/`
- `GET /api/transactions/{id}/`
- `GET /api/transactions/summary/`

### Payments
- `GET /api/payments/`
- `GET /api/payments/{id}/`

---

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Role-Based Access**: Manager and Cashier roles
3. **CORS Protection**: Configured for specific origins
4. **Password Validation**: Django's built-in validators
5. **CSRF Protection**: Enabled for session-based auth
6. **SQL Injection Protection**: Django ORM prevents SQL injection
7. **XSS Protection**: Django's template system escapes by default

---

## 📊 Business Logic Features

1. **Automatic Balance Calculation**:
   - Vendor balances auto-update on transactions
   - Customer balances auto-update on transactions
   - Invoice/Bill status auto-updates on payments

2. **Transaction Tracking**:
   - All financial activities logged
   - Complete audit trail
   - Reference linking between entities

3. **Inventory Management**:
   - Lot-based tracking
   - Auto-marking as billed
   - Value calculations

4. **Payment Processing**:
   - Multiple payment methods
   - Partial payment support
   - Payment history tracking

5. **Status Management**:
   - Auto-status updates based on payments
   - Overdue tracking
   - Balance due calculations

---

## 🚀 Performance Optimizations

1. **Database Queries**:
   - `select_related()` for foreign keys
   - `prefetch_related()` for reverse relations
   - Query optimization in viewsets

2. **Filtering & Search**:
   - Django Filter backend integration
   - Full-text search capabilities
   - Ordering support

3. **Pagination**:
   - Default page size: 100
   - Configurable per request

---

## 🧪 Testing & Quality

- Test structure in place for each app
- Admin interface for all models
- Comprehensive docstrings
- Clean code organization
- Django best practices followed

---

## 📝 Documentation Files

1. **README.md**: Complete documentation
2. **QUICKSTART.md**: Quick setup guide
3. **API_EXAMPLES.md**: Detailed API examples
4. **This file**: Project structure overview

---

## 🛠️ Technology Stack

- **Framework**: Django 5.0.1
- **API**: Django REST Framework 3.14.0
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **CORS**: django-cors-headers
- **Filtering**: django-filter

---

## 🔄 Next Steps for Production

1. Switch to PostgreSQL database
2. Set up environment variables properly
3. Configure static/media file serving
4. Set DEBUG=False
5. Add proper logging
6. Set up monitoring
7. Configure backup strategy
8. Enable SSL/HTTPS
9. Set up CI/CD pipeline
10. Add comprehensive tests

---

## 📞 Support

For issues or questions, refer to the documentation files or Django/DRF official documentation.

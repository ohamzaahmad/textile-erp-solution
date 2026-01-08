# TextileFlow ERP Backend

A Django REST Framework backend for TextileFlow ERP system.

## Features

- **User Management**: Custom user model with role-based access (Manager/Cashier)
- **Vendor Management**: Track vendors, their contacts, and outstanding balances
- **Customer Management**: Manage customer information and account balances
- **Inventory Management**: Track fabric inventory with lot numbers, types, meters, and pricing
- **Item Master**: Catalog of fabric types and standard pricing
- **Invoicing**: Create and manage customer invoices with line items
- **Bills**: Track vendor bills for received inventory
- **Payment Processing**: Record payments for both invoices and bills
- **Transaction History**: Complete audit trail of all financial transactions
- **Reports**: Summary statistics and analytics endpoints

## Installation

### Prerequisites

- Python 3.10+
- pip

### Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Obtain JWT tokens
- `POST /api/auth/refresh/` - Refresh access token

### Users
- `GET /api/users/` - List all users
- `POST /api/users/` - Create a new user
- `GET /api/users/{id}/` - Get user details
- `GET /api/users/me/` - Get current user info
- `POST /api/users/register/` - Register new user (public)

### Vendors
- `GET /api/vendors/` - List all vendors
- `POST /api/vendors/` - Create a new vendor
- `GET /api/vendors/{id}/` - Get vendor details
- `PUT /api/vendors/{id}/` - Update vendor
- `DELETE /api/vendors/{id}/` - Delete vendor
- `GET /api/vendors/{id}/transactions/` - Get vendor transaction history
- `POST /api/vendors/{id}/update_balance/` - Recalculate vendor balance

### Customers
- `GET /api/customers/` - List all customers
- `POST /api/customers/` - Create a new customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/{id}/transactions/` - Get customer transaction history
- `POST /api/customers/{id}/update_balance/` - Recalculate customer balance

### Inventory
- `GET /api/inventory/` - List all inventory items
- `POST /api/inventory/` - Add new inventory item
- `GET /api/inventory/{id}/` - Get inventory item details
- `PUT /api/inventory/{id}/` - Update inventory item
- `DELETE /api/inventory/{id}/` - Delete inventory item
- `GET /api/inventory/summary/` - Get inventory statistics
- `GET /api/inventory/by_vendor/` - Get inventory grouped by vendor
- `POST /api/inventory/{id}/mark_billed/` - Mark item as billed

### Item Master
- `GET /api/item-master/` - List all item masters
- `POST /api/item-master/` - Create new item master
- `GET /api/item-master/{id}/` - Get item master details
- `PUT /api/item-master/{id}/` - Update item master
- `DELETE /api/item-master/{id}/` - Delete item master
- `GET /api/item-master/categories/` - Get unique categories

### Invoices
- `GET /api/invoices/` - List all invoices
- `POST /api/invoices/` - Create a new invoice
- `GET /api/invoices/{id}/` - Get invoice details
- `PUT /api/invoices/{id}/` - Update invoice
- `DELETE /api/invoices/{id}/` - Delete invoice
- `POST /api/invoices/{id}/add_payment/` - Add payment to invoice
- `GET /api/invoices/summary/` - Get invoice statistics
- `GET /api/invoices/overdue/` - Get overdue invoices

### Bills
- `GET /api/bills/` - List all bills
- `POST /api/bills/` - Create a new bill
- `GET /api/bills/{id}/` - Get bill details
- `PUT /api/bills/{id}/` - Update bill
- `DELETE /api/bills/{id}/` - Delete bill
- `POST /api/bills/{id}/add_payment/` - Add payment to bill
- `GET /api/bills/summary/` - Get bill statistics
- `GET /api/bills/overdue/` - Get overdue bills

### Transactions
- `GET /api/transactions/` - List all transactions
- `GET /api/transactions/{id}/` - Get transaction details
- `GET /api/transactions/summary/` - Get transaction statistics

### Payment Records
- `GET /api/payments/` - List all payment records
- `GET /api/payments/{id}/` - Get payment details

## Database Models

### Core App
- **User**: Custom user model with role field (manager/cashier)

### Accounts App
- **Vendor**: Supplier information and balances
- **Customer**: Customer information and balances

### Inventory App
- **InventoryItem**: Fabric inventory with lot tracking
- **ItemMaster**: Master catalog of fabric types

### Transactions App
- **Transaction**: Base transaction log for all financial activities
- **Invoice**: Customer invoices with line items
- **InvoiceItem**: Line items for invoices
- **Bill**: Vendor bills with line items
- **BillItem**: Line items for bills
- **PaymentRecord**: Payment records for invoices/bills

## Configuration

### CORS Settings
Update `CORS_ALLOWED_ORIGINS` in `settings.py` to match your frontend URL.

### Database
By default, the project uses SQLite. To use PostgreSQL or MySQL, update the `DATABASES` setting in `settings.py`.

### JWT Settings
JWT tokens are configured in `SIMPLE_JWT` settings. Access tokens expire after 12 hours, refresh tokens after 7 days.

## Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/` with your superuser credentials.

## Development

### Making Changes

1. Create/modify models in the respective app's `models.py`
2. Create migrations: `python manage.py makemigrations`
3. Apply migrations: `python manage.py migrate`
4. Update serializers in `serializers.py`
5. Update views in `views.py`
6. Test your changes

### Running Tests

```bash
python manage.py test
```

## Deployment

For production deployment:

1. Set `DEBUG = False` in settings
2. Set a strong `SECRET_KEY`
3. Configure `ALLOWED_HOSTS`
4. Use a production database (PostgreSQL recommended)
5. Set up proper static file serving
6. Use environment variables for sensitive settings
7. Enable HTTPS
8. Set up proper logging

## License

MIT License

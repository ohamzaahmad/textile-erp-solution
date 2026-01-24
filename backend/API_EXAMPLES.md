# HA FABRICS ERP - API Examples

This document provides practical examples for using the HA FABRICS ERP API.

## Table of Contents
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Vendor Operations](#vendor-operations)
4. [Customer Operations](#customer-operations)
5. [Inventory Management](#inventory-management)
6. [Invoice Operations](#invoice-operations)
7. [Bill Operations](#bill-operations)
8. [Payment Processing](#payment-processing)

---

## Authentication

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## User Management

### Get Current User
```http
GET /api/users/me/
Authorization: Bearer {access_token}
```

### List Users
```http
GET /api/users/
Authorization: Bearer {access_token}
```

### Create User
```http
POST /api/users/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "name": "New User",
  "role": "cashier",
  "email": "newuser@example.com"
}
```

---

## Vendor Operations

### List All Vendors
```http
GET /api/vendors/
Authorization: Bearer {access_token}
```

### Search Vendors
```http
GET /api/vendors/?search=textile
Authorization: Bearer {access_token}
```

### Create Vendor
```http
POST /api/vendors/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Premium Textiles Ltd",
  "contact": "+1-555-9999",
  "address": "456 Industrial Park",
  "bank_details": "Bank: ABC Bank, Acc: 1234567890"
}
```

### Get Vendor Details
```http
GET /api/vendors/1/
Authorization: Bearer {access_token}
```

### Update Vendor
```http
PUT /api/vendors/1/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Premium Textiles Ltd",
  "contact": "+1-555-9999",
  "address": "456 Industrial Park, Suite 200"
}
```

### Get Vendor Transactions
```http
GET /api/vendors/1/transactions/
Authorization: Bearer {access_token}
```

### Recalculate Vendor Balance
```http
POST /api/vendors/1/update_balance/
Authorization: Bearer {access_token}
```

---

## Customer Operations

### List All Customers
```http
GET /api/customers/
Authorization: Bearer {access_token}
```

### Create Customer
```http
POST /api/customers/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Fashion House LLC",
  "contact": "+1-555-8888",
  "address": "789 Fashion Street"
}
```

### Get Customer Transactions
```http
GET /api/customers/1/transactions/
Authorization: Bearer {access_token}
```

---

## Inventory Management

### List Inventory
```http
GET /api/inventory/
Authorization: Bearer {access_token}
```

### Filter Inventory
```http
GET /api/inventory/?vendor=1&is_billed=false
Authorization: Bearer {access_token}
```

### Search Inventory
```http
GET /api/inventory/?search=cotton
Authorization: Bearer {access_token}
```

### Add Inventory Item
```http
POST /api/inventory/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "lot_number": "LOT-2026-001",
  "fabric_type": "Cotton Twill",
  "meters": 150.50,
  "unit_price": 15.75,
  "vendor": 1,
  "received_date": "2026-01-08"
}
```

### Get Inventory Summary
```http
GET /api/inventory/summary/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_items": 25,
  "total_meters": 2500.50,
  "unbilled_items": 10
}
```

### Get Inventory by Vendor
```http
GET /api/inventory/by_vendor/
Authorization: Bearer {access_token}
```

### Mark Item as Billed
```http
POST /api/inventory/1/mark_billed/
Authorization: Bearer {access_token}
```

---

## Invoice Operations

### List Invoices
```http
GET /api/invoices/
Authorization: Bearer {access_token}
```

### Filter Invoices by Status
```http
GET /api/invoices/?status=Pending
Authorization: Bearer {access_token}
```

### Filter Invoices by Customer
```http
GET /api/invoices/?customer=1
Authorization: Bearer {access_token}
```

### Create Invoice
```http
POST /api/invoices/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "invoice_number": "INV-2026-001",
  "customer": 1,
  "date": "2026-01-08",
  "due_date": "2026-02-08",
  "notes": "First order for January",
  "items": [
    {
      "inventory_item": 1,
      "meters": 50.0,
      "price": 18.00
    },
    {
      "inventory_item": 2,
      "meters": 30.0,
      "price": 20.00
    }
  ]
}
```

### Get Invoice Details
```http
GET /api/invoices/1/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 1,
  "invoice_number": "INV-2026-001",
  "customer": 1,
  "customer_name": "Fashion House LLC",
  "date": "2026-01-08",
  "due_date": "2026-02-08",
  "status": "Pending",
  "total": "1500.00",
  "amount_paid": "0.00",
  "balance_due": "1500.00",
  "notes": "First order for January",
  "items": [...],
  "payment_records": []
}
```

### Add Payment to Invoice
```http
POST /api/invoices/1/add_payment/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "date": "2026-01-10",
  "amount": 500.00,
  "method": "Bank",
  "bank_name": "ABC Bank",
  "tid": "TXN123456"
}
```

### Get Invoice Summary
```http
GET /api/invoices/summary/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_invoices": 15,
  "total_amount": 45000.00,
  "total_paid": 30000.00,
  "outstanding": 15000.00,
  "by_status": {
    "Pending": {"count": 5, "amount": 10000.00},
    "Partially Paid": {"count": 5, "amount": 15000.00},
    "Paid": {"count": 5, "amount": 20000.00}
  }
}
```

### Get Overdue Invoices
```http
GET /api/invoices/overdue/
Authorization: Bearer {access_token}
```

---

## Bill Operations

### Create Bill
```http
POST /api/bills/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "bill_number": "BILL-2026-001",
  "vendor": 1,
  "date": "2026-01-08",
  "due_date": "2026-02-08",
  "notes": "Payment for January inventory",
  "items": [
    {
      "inventory_item": 1,
      "meters": 150.0,
      "price": 15.00
    }
  ]
}
```

### Add Payment to Bill
```http
POST /api/bills/1/add_payment/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "date": "2026-01-10",
  "amount": 1000.00,
  "method": "Cash"
}
```

### Get Bill Summary
```http
GET /api/bills/summary/
Authorization: Bearer {access_token}
```

### Get Overdue Bills
```http
GET /api/bills/overdue/
Authorization: Bearer {access_token}
```

---

## Payment Processing

### List All Payments
```http
GET /api/payments/
Authorization: Bearer {access_token}
```

### Filter Payments by Method
```http
GET /api/payments/?method=Bank
Authorization: Bearer {access_token}
```

### Get Payment Details
```http
GET /api/payments/1/
Authorization: Bearer {access_token}
```

---

## Transaction History

### List All Transactions
```http
GET /api/transactions/
Authorization: Bearer {access_token}
```

### Filter by Transaction Type
```http
GET /api/transactions/?transaction_type=Invoice
Authorization: Bearer {access_token}
```

### Filter by Vendor
```http
GET /api/transactions/?vendor=1
Authorization: Bearer {access_token}
```

### Filter by Customer
```http
GET /api/transactions/?customer=1
Authorization: Bearer {access_token}
```

### Get Transaction Summary
```http
GET /api/transactions/summary/
Authorization: Bearer {access_token}
```

---

## Item Master Operations

### List Item Master Catalog
```http
GET /api/item-master/
Authorization: Bearer {access_token}
```

### Filter by Category
```http
GET /api/item-master/?category=Cotton
Authorization: Bearer {access_token}
```

### Search Items
```http
GET /api/item-master/?search=twill
Authorization: Bearer {access_token}
```

### Create Item Master
```http
POST /api/item-master/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "CT002",
  "name": "Cotton Canvas",
  "category": "Cotton",
  "description": "Heavy duty cotton canvas fabric",
  "unit_of_measure": "Meters",
  "standard_price": 22.50,
  "is_active": true
}
```

### Get Categories List
```http
GET /api/item-master/categories/
Authorization: Bearer {access_token}
```

---

## Common Query Parameters

### Pagination
```http
GET /api/vendors/?page=2&page_size=20
```

### Ordering
```http
GET /api/invoices/?ordering=-date
GET /api/customers/?ordering=name
```

### Multiple Filters
```http
GET /api/inventory/?vendor=1&is_billed=false&ordering=-received_date
```

---

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["This field is required."]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Notes

- All dates should be in ISO format: `YYYY-MM-DD`
- Decimal fields accept up to 2 decimal places
- All authenticated endpoints require the `Authorization: Bearer {token}` header
- Tokens expire after 12 hours (configurable)
- Use refresh token to get a new access token without re-logging in

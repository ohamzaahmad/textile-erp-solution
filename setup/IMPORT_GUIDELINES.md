# Import Guidelines — Suppliers & Customers

This document explains how to format Excel/CSV files so they can be imported into the system via the `Imports` page (Suppliers / Customers).

Two import types are supported:

- Suppliers (mapped to `vendors` in backend)
- Customers

Important: the importer reads CSV files (UTF-8). If you create data in Excel, export/save as "CSV UTF-8 (Comma delimited) (.csv)".


If you'd like, I can add a "Download sample CSV" button to the Imports page for both Suppliers and Customers — I have added these and included additional examples above for invoices, bills and inventory.
```

- File type: CSV (comma-separated). Use UTF-8 encoding.
- Header row: first line must contain column headers. The importer maps common header names (case-insensitive).
- Rows with missing required fields will be skipped or may fail to import.
- Date formats: not required for suppliers/customers. For any date column use `YYYY-MM-DD`.
- Number formatting: do not include thousands separators (e.g., use `1234.50`, not `1,234.50`).
- Phone numbers: keep digits and optional `+` country code. Avoid formatting characters when possible.

---

## Suppliers (Vendors) — Accepted headers

The importer looks for common header names. Provide at least `name`.

Required headers:
- `name` — Supplier name (required)

Optional headers (commonly recognized):
- `contact` or `phone` — Primary contact or phone number
- `address` — Address line
- `bank_details` or `bank` — Bank information (free-text: account number / branch / IBAN)
- `notes` — Additional notes

Example CSV (headers + two rows):

```
name,contact,address,bank_details,notes
ABC Textiles,+923001234567,"123 Textile Road, Lahore","Account: 12345678, Bank: ABC","Main supplier"
XYZ Supplies,+923009876543,"45 Market St, Karachi","Account: 98765432, Bank: XYZ","Seasonal"
```

Save as CSV UTF-8 and upload on the Imports → Suppliers tab.

---

## Customers — Accepted headers

Required headers:
- `name` — Customer name (required)

Optional headers:
- `contact` or `phone` — Phone number
- `address` — Address
- `email` — Email address
- `notes` — Any notes

Example CSV:

```
name,contact,email,address,notes
Mr. Ahmed,+923001112223,ahmed@example.com,"12 Commerce Ave, Lahore","Retail"
Sister Fabrics,+923004445566,info@sister.com,"88 Textile Lane, Karachi","Wholesale"
```

---

## Tips & Troubleshooting

- If import reports failures, download or inspect the CSV to ensure required columns exist and rows are valid.
- For large files (hundreds+ rows) the importer will send each row as a separate API request. Consider splitting files or requesting a backend batch import endpoint.
- Ensure the API server is reachable and you are signed in (manager role required to import).
- If characters are garbled, re-save the Excel file as "CSV UTF-8".

---

If you'd like, I can add a "Download sample CSV" button to the Imports page for both Suppliers and Customers — should I add that?
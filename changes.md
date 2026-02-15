# Changes Log

## 2026-02-14 - Broker commission support for sales orders

### Added
- Added broker master entity in backend:
  - New model: `Broker` in `backend/accounts/models.py`
  - New serializer: `BrokerSerializer`
  - New API viewset: `BrokerViewSet`
  - New route: `/api/brokers/`
  - Admin registration for Broker

### Invoice enhancements
- Added broker and commission support to invoices:
  - `broker` (optional FK to Broker)
  - `commission_type` (`Percentage` or `Fixed`)
  - `commission_value`
  - `commission_amount` (calculated)
- Invoice creation now validates and calculates commission when broker is provided.
- Invoice list/search/filter now supports broker and commission fields.
- Invoice admin list now shows broker + commission details.

### Frontend enhancements
- Added `Broker` type and invoice broker/commission fields in `frontend/types.ts`.
- Added `brokersAPI` in `frontend/api.ts`.
- App now loads brokers from backend and passes them to invoice screen.
- Invoice creation UI now includes a Broker & Commission section:
  - Select broker
  - Choose commission type (percentage/fixed)
  - Enter commission value
  - Live calculated commission payable preview
- Invoice table now shows broker and commission per invoice.
- Added dedicated Broker management screen in frontend:
  - New page: `Broker Center`
  - Sidebar navigation entry for brokers
  - Add / Edit / Delete broker support via API
  - Integrated in app routing/state
- Added broker search/filter in Sales list view (`InvoiceBillCenter`) allowing quick filtering by broker name.

- Fixed CSV import parsing and numeric parsing in `frontend/components/Imports.tsx`:
  - `parseCsv` now handles quoted fields and commas properly.
  - Numeric fields (meters, prices, ids) are normalized to remove thousands separators and currency symbols before parsing.
  - `parseItemsCell` now tolerates numeric ids with separators and non-numeric inventory identifiers.

### Commission settlement in Broker Center
- Added `commission_settled` boolean field to Invoice model (`backend/transactions/models.py`).
- Added `settle_commission` API action on InvoiceViewSet (`POST /api/invoices/{id}/settle_commission/`).
- Updated `InvoiceSerializer` to include `commission_settled`.
- New migration: `backend/transactions/migrations/0003_invoice_commission_settled.py`.
- Rewrote `BrokerCenter.tsx` to match VendorCenter/CustomerCenter UI pattern:
  - Sidebar now shows pending commission amount per broker.
  - Detail pane shows outstanding commission total (large header), summary cards (Total / Settled / Pending).
  - Commission invoices table with columns: Date, Invoice # (clickable link), Customer, Total, Type, Commission, Status, Actions.
  - Invoice # column links navigate to the invoice detail in InvoiceBillCenter.
  - Settle button opens a confirmation modal showing invoice details and commission payable.
  - Settlement calls backend and updates local state instantly.
- Wired `handleSettleCommission` in `App.tsx`; BrokerCenter now receives `invoices`, `customers`, `onSettleCommission`, `onNavigate` props.

### New migrations
- `backend/accounts/migrations/0002_broker.py`
- `backend/transactions/migrations/0002_invoice_broker_and_commission.py`
- `backend/transactions/migrations/0003_invoice_commission_settled.py`

### Notes
- Run migrations before using the new fields:
  - `python manage.py migrate`

# HA FABRICS ERP - Change Plan

## Project Summary
Textile ERP system with Django REST backend + React/TypeScript/Vite frontend.
- **Backend**: Django apps — accounts, inventory, transactions, expenses
- **Frontend**: React SPA — InventoryCenter, InvoiceBillCenter, PrintPreview, etc.
- **Flow**: Receive Inventory → Create Bills (Purchase) → Create Invoices (Sales) → Payments

---

## Tasks

- [x] **Task 1: Editable Lot Items in Receive Inventory Page**
  - **File**: `frontend/components/InventoryCenter.tsx`
  - **Current**: When receiving a lot, fabrics added to the preview table are read-only (can only be removed)
  - **Change**: Make fabric items in the "Receive Lot" modal editable — allow inline editing of fabric type, meters, and unit price after they have been added to the list
  - **Details**:
    - Add edit functionality to each row in the fabrics preview table
    - Allow changing type (dropdown), meters (number input), and unit price (number input) inline
    - Keep the remove button as well

- [x] **Task 2: Show Lot Number + Fabric Type + Available Meters in Invoice Creation**
  - **File**: `frontend/components/InvoiceBillCenter.tsx`
  - **Current**: Fabric dropdown in invoice creation shows: `{type} ({meters}m avail)`
  - **Change**: Show lot number alongside fabric type and available meters: `LOT-XXXX | Fabric Type (XXXm avail)`
  - **Details**:
    - Update the `<option>` text in the "Add Fabric" dropdown for invoices
    - Also show lot number in the line items table after fabric is added

- [x] **Task 3: Redesign Bill & Invoice Print for A5 Page**
  - **File**: `frontend/components/PrintPreview.tsx`
  - **Current**: Designed for large page (A4/Letter) with wide padding, 4xl max-width
  - **Change**: Redesign for A5 paper size (148mm × 210mm) with compact layout
  - **Details**:
    - Reduce padding, font sizes, and margins throughout
    - Set print CSS to A5 page size
    - Make header, party info, items table, payment history, and footer compact
    - Ensure proper page breaks and fit within A5 dimensions
    - Update print-specific styles for A5 output
    - Added signature area for Authorized Signature and Received By


import React from 'react';
import { Vendor, Customer, InventoryItem } from './types';

export const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Abid Wood Frames', contact: '0300-4866664', balance: -7660, logs: [] },
  { id: 'v2', name: 'Ahsan Traders 4D', contact: '042-3581234', balance: 0, logs: [] },
  { id: 'v3', name: 'American Media Imran', contact: '0321-4567890', balance: 60, logs: [] },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'AH Traders', contact: '0312-3456789', balance: 33468, logs: [] },
  { id: 'c2', name: 'AG Printer', contact: '0333-1112233', balance: 0, logs: [] },
  { id: 'c3', name: 'Ahmad Baig', contact: '0345-9988776', balance: 27330, logs: [] },
];

// Added missing required properties 'receivedDate' and 'isBilled' to satisfy InventoryItem interface
export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', lotNumber: 'LOT-1021', type: 'Cotton Twill', meters: 450, unitPrice: 120, vendorId: 'v1', receivedDate: '2024-01-01', isBilled: true },
  { id: 'i2', lotNumber: 'LOT-1022', type: 'Denim Heavy', meters: 200, unitPrice: 350, vendorId: 'v1', receivedDate: '2024-01-01', isBilled: true },
  { id: 'i3', lotNumber: 'LOT-2005', type: 'Silk Smooth', meters: 85, unitPrice: 850, vendorId: 'v2', receivedDate: '2024-01-01', isBilled: true },
];

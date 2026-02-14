
export type Role = 'manager' | 'cashier';

export interface User {
  username: string;
  role: Role;
  name: string;
}

export type Page = 'home' | 'vendors' | 'brokers' | 'customers' | 'inventory' | 'invoices' | 'bills' | 'reports' | 'deposits' | 'itemMaster' | 'expenses' | 'imports';

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  address?: string;
  bankDetails?: string;
  balance: number;
  logs: Transaction[];
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address?: string;
  shortDescription?: string;
  balance: number;
  logs: Transaction[];
}

export interface Broker {
  id: string;
  name: string;
  contact?: string;
  address?: string;
}

export interface InventoryItem {
  id: string;
  lotNumber: string;
  type: string;
  meters: number;
  unitPrice: number;
  vendorId: string;
  receivedDate: string;
  isBilled: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Bill' | 'Invoice' | 'Payment' | 'Settlement';
  amount: number;
  description: string;
  referenceId?: string;
}

export type PaymentMethod = 'Credit' | 'Cash' | 'Bank';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  bankName?: string;
  tid?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  brokerId?: string;
  brokerName?: string;
  commissionType?: 'Percentage' | 'Fixed';
  commissionValue?: number;
  commissionAmount?: number;
  date: string;
  dueDate: string;
  items: { itemId: string; meters: number; price: number }[];
  status: 'Pending' | 'Partially Paid' | 'Paid';
  total: number;
  amountPaid: number;
  paymentHistory: PaymentRecord[];
}

export interface Bill {
  id: string;
  vendorId: string;
  date: string;
  dueDate: string;
  items: { itemId: string; meters: number; price: number }[];
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  total: number;
  amountPaid: number;
  paymentHistory: PaymentRecord[];
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'Cash' | 'Bank' | 'Credit';
  notes: string;
}

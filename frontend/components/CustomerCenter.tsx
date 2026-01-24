
import React, { useState } from 'react';
import { Customer, Invoice, PaymentRecord, Transaction } from '../types';
import { emitToast } from '../api';

interface CustomerCenterProps {
  customers: Customer[];
  invoices: Invoice[];
  onReceivePayment: (invoiceId: string, payment: PaymentRecord) => void;
  onAddCustomer: (customer: Customer) => Promise<Customer | null>;
}

const CustomerCenter: React.FC<CustomerCenterProps> = ({ customers, invoices, onReceivePayment, onAddCustomer }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [viewMode, setViewMode] = useState<'invoices' | 'ledger'>('invoices');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  
  const [newCustomerData, setNewCustomerData] = useState({ 
    name: '', 
    contact: '', 
    address: '',
    shortDescription: ''
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomerId);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPayment = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPaymentAmount(invoice.total - invoice.amountPaid);
  };

  const handleConfirmPayment = () => {
    if (payingInvoice && paymentAmount > 0) {
      const remaining = payingInvoice.total - payingInvoice.amountPaid;
      if (paymentAmount <= 0) {
        emitToast('Payment amount must be greater than zero', 'error');
        return;
      }
      if (paymentAmount > remaining) {
        emitToast('Payment cannot exceed outstanding invoice amount', 'error');
        return;
      }

      const payment: PaymentRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: paymentAmount,
        method: 'Cash'
      };
      onReceivePayment(payingInvoice.id, payment);
      setPayingInvoice(null);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name) {
      alert("Customer name is required.");
      return;
    }
    const customer: Customer = {
      id: '', // Will be assigned by backend
      name: newCustomerData.name,
      contact: newCustomerData.contact,
      address: newCustomerData.address,
      shortDescription: newCustomerData.shortDescription,
      balance: 0,
      logs: []
    };
    const result = await onAddCustomer(customer);
    setIsCreatingCustomer(false);
    setNewCustomerData({ name: '', contact: '', address: '', shortDescription: '' });
    if (result) {
      setSelectedCustomerId(result.id); // Use the ID from backend response
    }
  };

  return (
    <div className="flex h-full bg-[#f0f3f6] rounded border border-[#a3b6cc] overflow-hidden shadow-2xl">
      {/* Modals */}
      {isCreatingCustomer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Add New Customer</span>
              <button onClick={() => setIsCreatingCustomer(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="Customer Name" />
              <input type="text" value={newCustomerData.contact} onChange={e => setNewCustomerData({...newCustomerData, contact: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="Contact Phone" />
              <input type="text" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="Address (optional)" />
              <input type="text" value={newCustomerData.shortDescription} onChange={e => setNewCustomerData({...newCustomerData, shortDescription: e.target.value})} className="w-full border p-2 text-sm outline-none" placeholder="Short description (optional)" />
              <div className="pt-4 flex justify-end space-x-2 border-t">
                <button onClick={() => setIsCreatingCustomer(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleCreateCustomer} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {payingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-4 text-white font-bold text-sm flex justify-between items-center">
              <span>Receive Payment for #{payingInvoice.id}</span>
              <button onClick={() => setPayingInvoice(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-5">
              <input type="number" autoFocus value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="w-full border p-2 text-xl font-black text-red-700 outline-none" />
              <button onClick={handleConfirmPayment} className="w-full py-3 text-xs font-black bg-green-600 text-white rounded uppercase tracking-widest shadow-lg">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-[#a3b6cc] flex flex-col shrink-0">
        <div className="p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase whitespace-nowrap">Active Customers</span>
            <button onClick={() => setIsCreatingCustomer(true)} className="text-[10px] font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm whitespace-nowrap">New Customer</button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-xs p-2 pl-9 border border-[#7d2b3f]/60 rounded-sm outline-none shadow-inner" />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-[10px]"></i>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCustomers.map(c => (
            <div key={c.id} onClick={() => setSelectedCustomerId(c.id)} className={`p-3 border-b border-[#e1e8ef] cursor-pointer transition-all flex justify-between items-center group ${selectedCustomerId === c.id ? 'bg-[#7d2b3f] text-white shadow-md' : 'hover:bg-slate-50'}`}>
              <div className="flex flex-col min-w-0">
                <span className={`text-[12px] font-bold truncate ${selectedCustomerId === c.id ? 'text-white' : 'text-[#7d2b3f]'}`}>{c.name}</span>
                <span className={`text-[10px] ${selectedCustomerId === c.id ? 'text-red-100' : 'text-slate-400'}`}>{c.contact}</span>
              </div>
              <span className={`text-[11px] font-black ${selectedCustomerId === c.id ? 'text-white' : (c.balance > 0 ? 'text-green-600' : 'text-slate-400')}`}>
                {c.balance.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Detail */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedCustomer ? (
          <>
            <div className="p-10 border-b border-[#e1e8ef] bg-white flex justify-between items-start">
              <div className="space-y-3">
                <h2 className="text-4xl font-light text-slate-400 tracking-tight">Customer Information</h2>
                <div className="pt-2">
                   <p className="text-xl font-bold text-slate-800 uppercase tracking-tighter">{selectedCustomer.name}</p>
                   <p className="text-sm text-slate-500 font-medium">{selectedCustomer.contact}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Accounts Receivable</span>
                <p className={`text-5xl font-black mt-2 leading-none text-green-600`}>
                  PKR {selectedCustomer.balance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-6 flex space-x-10 border-b border-[#e1e8ef]">
                <button 
                  onClick={() => setViewMode('invoices')} 
                  className={`pb-4 text-[13px] font-black uppercase tracking-widest border-b-4 transition-all ${viewMode === 'invoices' ? 'border-[#2b5797] text-[#2b5797]' : 'border-transparent text-slate-400'}`}
                >
                  Invoices Center
                </button>
                <button 
                  onClick={() => setViewMode('ledger')} 
                  className={`pb-4 text-[13px] font-black uppercase tracking-widest border-b-4 transition-all ${viewMode === 'ledger' ? 'border-[#2b5797] text-[#2b5797]' : 'border-transparent text-slate-400'}`}
                >
                  Transaction Ledger
                </button>
              </div>
              
              <div className="flex-1 p-8 overflow-auto">
                {viewMode === 'invoices' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#e1e8ef] uppercase font-black text-[10px]">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Doc #</th>
                        <th className="pb-4 text-right">Invoice Total</th>
                        <th className="pb-4 text-right">Collected</th>
                        <th className="pb-4 text-right">Outstanding</th>
                        <th className="pb-4 text-center">Status</th>
                        <th className="pb-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customerInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-slate-600 font-bold">{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</td>
                          <td className="py-4 font-mono text-[10px] text-green-600">{inv.id}</td>
                          <td className="py-4 text-right text-slate-500 font-bold">Rs. {inv.total.toLocaleString()}</td>
                          <td className="py-4 text-right text-green-600 font-bold">Rs. {inv.amountPaid.toLocaleString()}</td>
                          <td className="py-4 text-right font-black text-red-700">Rs. {(inv.total - inv.amountPaid).toLocaleString()}</td>
                          <td className="py-4 text-center">
                             <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border ${inv.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                               {inv.status}
                             </span>
                          </td>
                          <td className="py-4 text-right">
                             {inv.status !== 'Paid' && (
                               <button onClick={() => handleOpenPayment(inv)} className="bg-green-600 text-white px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-tight shadow-md hover:bg-green-700 active:scale-95 transition-all">Receive</button>
                             )}
                          </td>
                        </tr>
                      ))}
                      {customerInvoices.length === 0 && (
                        <tr><td colSpan={7} className="py-24 text-center text-slate-300 italic">No transactions found for this customer</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 text-slate-400 border-b border-slate-200">
                      <tr className="uppercase font-black text-[10px] tracking-widest">
                        <th className="p-4">Date</th>
                        <th className="p-4">Transaction Details</th>
                        <th className="p-4">Reference</th>
                        <th className="p-4 text-right">Sales (+)</th>
                        <th className="p-4 text-right">Collection (-)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedCustomer.logs.map((log: Transaction) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-600">{log.date ? new Date(log.date).toLocaleDateString() : ''}</td>
                          <td className="p-4 text-slate-700">{log.description}</td>
                          <td className="p-4 font-mono text-[10px] text-green-600">#{log.referenceId}</td>
                          <td className="p-4 text-right text-red-600 font-bold">{log.type === 'Invoice' ? log.amount.toLocaleString() : '-'}</td>
                          <td className="p-4 text-right text-green-600 font-bold">{log.type === 'Payment' ? log.amount.toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                      {selectedCustomer.logs.length === 0 && (
                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic uppercase font-black opacity-20 tracking-widest">No transaction logs available</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-[#f8f9fa]">
             <i className="fas fa-users text-7xl mb-6 opacity-30"></i>
             <p className="text-xl font-light italic text-slate-500 opacity-60 uppercase tracking-widest font-black">Select a customer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerCenter;

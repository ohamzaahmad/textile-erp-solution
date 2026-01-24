
import React, { useState } from 'react';
import { Vendor, Bill, PaymentRecord, Transaction } from '../types';
import { emitToast } from '../api';

interface VendorCenterProps {
  vendors: Vendor[];
  bills: Bill[];
  onPayBill: (billId: string, payment: PaymentRecord) => void;
  onAddVendor: (vendor: Vendor) => Promise<Vendor | null>;
}

const VendorCenter: React.FC<VendorCenterProps> = ({ vendors, bills, onPayBill, onAddVendor }) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(vendors[0]?.id || null);
  const [viewMode, setViewMode] = useState<'bills' | 'ledger'>('bills');
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);
  
  const [newVendorData, setNewVendorData] = useState({ 
    name: '', 
    contact: '', 
    address: '', 
    bankDetails: '',
    shortDescription: ''
  });

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const vendorBills = bills.filter(b => b.vendorId === selectedVendorId);

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPay = (bill: Bill) => {
    setPayingBill(bill);
    setPaymentAmount(bill.total - bill.amountPaid);
  };

  const handleConfirmPayment = () => {
    if (payingBill && paymentAmount > 0) {
      const remaining = payingBill.total - payingBill.amountPaid;
      if (paymentAmount <= 0) {
        emitToast('Payment amount must be greater than zero', 'error');
        return;
      }
      if (paymentAmount > remaining) {
        emitToast('Payment cannot exceed open balance', 'error');
        return;
      }

      const payment: PaymentRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: paymentAmount,
        method: 'Cash'
      };
      onPayBill(payingBill.id, payment);
      setPayingBill(null);
    }
  };

  const handleCreateVendor = async () => {
    if (!newVendorData.name) {
      alert("Supplier name is required.");
      return;
    }
    const vendor: Vendor = {
      id: '', // Will be assigned by backend
      name: newVendorData.name,
      contact: newVendorData.contact,
      address: newVendorData.address,
      bankDetails: newVendorData.bankDetails,
      balance: 0,
      logs: []
    };
    const result = await onAddVendor(vendor);
    setIsCreatingVendor(false);
    setNewVendorData({ name: '', contact: '', address: '', bankDetails: '', shortDescription: '' });
    if (result) {
      setSelectedVendorId(result.id); // Use the ID from backend response
    }
  };

  return (
    <div className="flex h-full bg-[#f0f3f6] rounded border border-[#a3b6cc] overflow-hidden shadow-2xl">
      {/* New Vendor Modal */}
      {isCreatingVendor && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Add New Supplier</span>
              <button onClick={() => setIsCreatingVendor(false)} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Supplier Name</label>
                  <input type="text" value={newVendorData.name} onChange={e => setNewVendorData({...newVendorData, name: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="Enter company name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Contact Phone</label>
                  <input type="text" value={newVendorData.contact} onChange={e => setNewVendorData({...newVendorData, contact: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Address</label>
                  <input type="text" value={newVendorData.address} onChange={e => setNewVendorData({...newVendorData, address: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="Street, City, Country" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Short Description</label>
                  <input type="text" value={newVendorData.shortDescription} onChange={e => setNewVendorData({...newVendorData, shortDescription: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="Optional short notes" />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t">
                <button onClick={() => setIsCreatingVendor(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleCreateVendor} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save Supplier</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-4 text-white font-bold text-sm flex justify-between items-center">
              <span>Settle Purchase #{payingBill.id}</span>
              <button onClick={() => setPayingBill(null)} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Payment Amount (PKR)</label>
                <input type="number" autoFocus value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="w-full border border-slate-300 rounded p-2 text-xl font-black text-red-700 outline-none" />
              </div>
              <button onClick={handleConfirmPayment} className="w-full py-3 text-xs font-black bg-green-600 text-white rounded uppercase tracking-widest shadow-lg">Confirm Settlement</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-[280px] bg-white border-r border-[#a3b6cc] flex flex-col shrink-0">
        <div className="p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase whitespace-nowrap">Active Vendors</span>
            <button onClick={() => setIsCreatingVendor(true)} className="text-[10px] font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm whitespace-nowrap">New Supplier</button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-xs p-2 pl-9 border border-[#7d2b3f]/60 rounded-sm outline-none shadow-inner" />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-[10px]"></i>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredVendors.map(v => (
            <div key={v.id} onClick={() => setSelectedVendorId(v.id)} className={`p-3 border-b border-[#e1e8ef] cursor-pointer transition-all flex justify-between items-center group ${selectedVendorId === v.id ? 'bg-[#7d2b3f] text-white' : 'hover:bg-slate-50'}`}>
              <div className="flex flex-col min-w-0">
                <span className={`text-[12px] font-bold truncate ${selectedVendorId === v.id ? 'text-white' : 'text-[#7d2b3f]'}`}>{v.name}</span>
                <span className={`text-[10px] ${selectedVendorId === v.id ? 'text-blue-100' : 'text-slate-400'}`}>{v.contact}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                 <span className={`text-[11px] font-black ${selectedVendorId === v.id ? 'text-white' : (v.balance < 0 ? 'text-red-600' : 'text-green-600')}`}>
                    {v.balance.toLocaleString()}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedVendor ? (
          <>
            <div className="p-10 border-b border-[#e1e8ef] bg-white flex justify-between items-start">
              <div className="space-y-3">
                <h2 className="text-4xl font-light text-slate-400 tracking-tight">Supplier Information</h2>
                <div className="pt-2">
                   <p className="text-xl font-bold text-slate-800 uppercase tracking-tighter">{selectedVendor.name}</p>
                   <p className="text-sm text-slate-500 font-medium">{selectedVendor.contact}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Outstanding Payables</span>
                <p className={`text-5xl font-black mt-2 leading-none ${selectedVendor.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  PKR {Math.abs(selectedVendor.balance).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-6 flex space-x-10 border-b border-[#e1e8ef]">
                <button 
                  onClick={() => setViewMode('bills')} 
                  className={`pb-4 text-[13px] font-black uppercase tracking-widest border-b-4 transition-all ${viewMode === 'bills' ? 'border-[#2b5797] text-[#2b5797]' : 'border-transparent text-slate-400'}`}
                >
                  Purchases
                </button>
                <button 
                  onClick={() => setViewMode('ledger')} 
                  className={`pb-4 text-[13px] font-black uppercase tracking-widest border-b-4 transition-all ${viewMode === 'ledger' ? 'border-[#2b5797] text-[#2b5797]' : 'border-transparent text-slate-400'}`}
                >
                  Transaction Ledger
                </button>
              </div>
              
              <div className="flex-1 p-8 overflow-auto">
                {viewMode === 'bills' ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-[#e1e8ef] uppercase font-black text-[10px]">
                        <th className="pb-4">Purchase Date</th>
                        <th className="pb-4">Doc #</th>
                        <th className="pb-4 text-right">Total Amount</th>
                        <th className="pb-4 text-right">Settled</th>
                        <th className="pb-4 text-right">Open Balance</th>
                        <th className="pb-4 text-center">Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {vendorBills.map(bill => (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-slate-600 font-bold">{bill.date ? new Date(bill.date).toLocaleDateString() : ''}</td>
                          <td className="py-4 font-mono text-[10px] text-blue-600">{bill.id}</td>
                          <td className="py-4 text-right text-slate-500 font-bold">Rs. {bill.total.toLocaleString()}</td>
                          <td className="py-4 text-right text-green-600 font-bold">Rs. {bill.amountPaid.toLocaleString()}</td>
                          <td className="py-4 text-right font-black text-red-600">Rs. {(bill.total - bill.amountPaid).toLocaleString()}</td>
                          <td className="py-4 text-center">
                             <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
                               {bill.status}
                             </span>
                          </td>
                          <td className="py-4 text-right">
                             {bill.status !== 'Paid' && (
                               <button onClick={() => handleOpenPay(bill)} className="bg-[#7d2b3f] text-white px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-sm">Settle</button>
                             )}
                          </td>
                        </tr>
                      ))}
                      {vendorBills.length === 0 && (
                        <tr><td colSpan={7} className="py-20 text-center text-slate-300 italic">No purchases found.</td></tr>
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
                        <th className="p-4 text-right">Dr (Bills)</th>
                        <th className="p-4 text-right">Cr (Payments)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedVendor.logs.map((log: Transaction) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-600">{log.date ? new Date(log.date).toLocaleDateString() : ''}</td>
                          <td className="p-4 text-slate-700">{log.description}</td>
                          <td className="p-4 font-mono text-[10px] text-blue-600">#{log.referenceId}</td>
                          <td className="p-4 text-right text-red-600 font-bold">{log.type === 'Bill' ? log.amount.toLocaleString() : '-'}</td>
                          <td className="p-4 text-right text-green-600 font-bold">{log.type === 'Payment' ? log.amount.toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                      {selectedVendor.logs.length === 0 && (
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
             <i className="fas fa-truck text-7xl mb-6 opacity-30"></i>
             <p className="text-lg font-light italic">Select a supplier to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorCenter;

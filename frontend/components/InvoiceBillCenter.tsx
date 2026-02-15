
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Bill, Vendor, Customer, Broker, InventoryItem, PaymentMethod, PaymentRecord } from '../types';
import PrintPreview from './PrintPreview';

interface InvoiceBillCenterProps {
  type: 'Invoice' | 'Bill';
  items: (Invoice | Bill)[];
  onAdd: (item: any) => void;
  vendors: Vendor[];
  customers: Customer[];
  brokers: Broker[];
  inventory: InventoryItem[];
  preFilledLot: InventoryItem[] | null;
  onPayBill?: (billId: string, payment: PaymentRecord) => void;
  onReceivePayment?: (invoiceId: string, payment: PaymentRecord) => void;
}

interface LineItem {
  id: string;
  itemId: string;
  meters: number;
  price: number;
  lotNumber?: string;
  type?: string;
}

const PAK_BANKS = ['Meezan Bank', 'Habib Bank (HBL)', 'Bank Alfalah'];

const InvoiceBillCenter: React.FC<InvoiceBillCenterProps> = ({ 
  type, items, onAdd, vendors, customers, brokers, inventory, preFilledLot, onPayBill, onReceivePayment 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [settlingItem, setSettlingItem] = useState<any>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [printingDoc, setPrintingDoc] = useState<any>(null);
  
  // Creation States
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [creationMethod, setCreationMethod] = useState<PaymentMethod>('Credit');
  const [creationBank, setCreationBank] = useState(PAK_BANKS[0]);
  const [creationTid, setCreationTid] = useState('');
  const [creationAmount, setCreationAmount] = useState<number>(0);
  const [creationNotes, setCreationNotes] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [commissionType, setCommissionType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [commissionValue, setCommissionValue] = useState<number>(0);
  const [creationDueDays, setCreationDueDays] = useState<number>(30);
  const [currentLineItem, setCurrentLineItem] = useState({ itemId: '', meters: 0, price: 0 });
  const [brokerFilterText, setBrokerFilterText] = useState('');
  const [docFilterText, setDocFilterText] = useState('');
  const [nameFilterText, setNameFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All'|'Paid'|'Partially Paid'|'Unpaid'>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Settlement Modal States
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('Cash');
  const [settleBank, setSettleBank] = useState(PAK_BANKS[0]);
  const [settleTid, setSettleTid] = useState('');

  useEffect(() => {
    if (preFilledLot && preFilledLot.length > 0 && type === 'Bill') {
      setIsCreating(true);
      setSelectedEntityId(preFilledLot[0].vendorId);
      setLineItems(preFilledLot.map(item => ({
        id: `li-${item.id}`,
        itemId: item.id,
        meters: item.meters,
        price: item.unitPrice,
        lotNumber: item.lotNumber,
        type: item.type
      })));
    }
  }, [preFilledLot, type]);

  // Reset amount to 0 when Credit is selected
  useEffect(() => {
    if (creationMethod === 'Credit') {
      setCreationAmount(0);
    }
  }, [creationMethod]);

  const handleAddLineItem = () => {
    if (!currentLineItem.itemId || currentLineItem.meters <= 0) {
      alert("Select fabric and valid quantity");
      return;
    }
    const invRef = inventory.find(i => i.id === currentLineItem.itemId);
    if (type === 'Invoice' && invRef && currentLineItem.meters > invRef.meters) {
      alert(`Insufficient stock. Available: ${invRef.meters}m`);
      return;
    }
    setLineItems([...lineItems, {
      id: `li-${Date.now()}`,
      ...currentLineItem,
      lotNumber: invRef?.lotNumber,
      type: invRef?.type
    }]);
    setCurrentLineItem({ itemId: '', meters: 0, price: 0 });
  };

  const totalAmount = useMemo(() => lineItems.reduce((acc, curr) => acc + (curr.meters * curr.price), 0), [lineItems]);
  const calculatedCommission = useMemo(() => {
    if (type !== 'Invoice' || !selectedBrokerId || commissionValue <= 0) return 0;
    if (commissionType === 'Percentage') return (totalAmount * commissionValue) / 100;
    return commissionValue;
  }, [type, selectedBrokerId, commissionType, commissionValue, totalAmount]);

  const handleSave = () => {
    if (!selectedEntityId || lineItems.length === 0) {
      alert("Add entity and line items");
      return;
    }
    // validate initial payment and totals
    const totalAmountNow = totalAmount;
    if (creationAmount < 0) {
      // negative initial payment not allowed
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Initial payment cannot be negative', level: 'error' } })); } catch {}
      return;
    }
    if (creationAmount > totalAmountNow) {
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Initial payment cannot exceed document total', level: 'error' } })); } catch {}
      return;
    }

    if (type === 'Invoice' && selectedBrokerId && commissionType === 'Percentage' && commissionValue > 100) {
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Commission percentage cannot exceed 100%', level: 'error' } })); } catch {}
      return;
    }
    
    // For Bank method, require TID if payment amount > 0
    if (creationMethod === 'Bank' && creationAmount > 0 && !creationTid.trim()) {
      alert('Please enter Transaction ID for bank payment');
      return;
    }

    const initialPayment: PaymentRecord | null = (creationAmount > 0) ? {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: creationAmount,
      method: creationMethod,
      bankName: creationMethod === 'Bank' ? creationBank : undefined,
      tid: creationMethod === 'Bank' ? creationTid : undefined
    } : null;

    const newItem = {
      id: `${type.slice(0, 3)}-${Date.now()}`,
      [type === 'Invoice' ? 'customerId' : 'vendorId']: selectedEntityId,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + (creationDueDays || 30) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      brokerId: type === 'Invoice' && selectedBrokerId ? selectedBrokerId : undefined,
      commissionType: type === 'Invoice' && selectedBrokerId ? commissionType : '',
      commissionValue: type === 'Invoice' && selectedBrokerId ? commissionValue : 0,
      commissionAmount: type === 'Invoice' && selectedBrokerId ? calculatedCommission : 0,
      items: lineItems.map(li => ({ itemId: li.itemId, meters: li.meters, price: li.price })),
      total: totalAmount,
      amountPaid: initialPayment ? creationAmount : 0,
      paymentHistory: initialPayment ? [initialPayment] : [],
      notes: creationNotes,
      initialPayment: initialPayment // Pass for backend API call
    };
    onAdd(newItem);
    resetForm();
  };

  const resetForm = () => {
    setIsCreating(false);
    setSelectedEntityId('');
    setLineItems([]);
    setCreationMethod('Credit');
    setCreationAmount(0);
    setCreationTid('');
    setCreationNotes('');
    setSelectedBrokerId('');
    setCommissionType('Percentage');
    setCommissionValue(0);
    setCreationDueDays(30);
  };

  const handleOpenSettle = (item: any) => {
    setSettlingItem(item);
    setSettleAmount(item.total - item.amountPaid);
    setSettleMethod('Cash');
    setSettleTid('');
  };

  const handleConfirmSettle = () => {
    if (!settlingItem || settleAmount <= 0) return;
    const remaining = settlingItem.total - settlingItem.amountPaid;
    if (settleAmount <= 0) {
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Payment must be greater than zero', level: 'error' } })); } catch {}
      return;
    }
    if (settleAmount > remaining) {
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Payment cannot exceed open balance', level: 'error' } })); } catch {}
      return;
    }

    const payment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: settleAmount,
      method: settleMethod,
      bankName: settleMethod === 'Bank' ? settleBank : undefined,
      tid: settleMethod === 'Bank' ? settleTid : undefined
    };

    if (type === 'Bill' && onPayBill) onPayBill(settlingItem.id, payment);
    else if (type === 'Invoice' && onReceivePayment) onReceivePayment(settlingItem.id, payment);
    setSettlingItem(null);
  };

  const handlePrint = (doc: any) => {
    setPrintingDoc(doc);
  };

  const availableInventory = type === 'Bill' 
    ? inventory.filter(i => !i.isBilled && (selectedEntityId ? i.vendorId === selectedEntityId : true))
    : inventory.filter(i => i.meters > 0);

  // Sort items: overdue first, then by date
  const sortedItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...items].sort((a, b) => {
      const aDueDate = a.dueDate ? new Date(a.dueDate) : null;
      const bDueDate = b.dueDate ? new Date(b.dueDate) : null;
      const aDaysRemaining = aDueDate ? Math.ceil((aDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const bDaysRemaining = bDueDate ? Math.ceil((bDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const aOverdue = a.status !== 'Paid' && aDaysRemaining !== null && aDaysRemaining < 0;
      const bOverdue = b.status !== 'Paid' && bDaysRemaining !== null && bDaysRemaining < 0;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    let list = [...sortedItems];

    // filter by name (customer/vendor)
    if (nameFilterText.trim()) {
      const q = nameFilterText.trim().toLowerCase();
      list = list.filter((it: any) => {
        const partyName = (type === 'Invoice' ? customers.find(c => c.id === it.customerId)?.name : vendors.find(v => v.id === it.vendorId)?.name) || '';
        return partyName.toString().toLowerCase().includes(q);
      });
    }

    // filter by doc id/text
    if (docFilterText.trim()) {
      const q = docFilterText.trim().toLowerCase();
      list = list.filter((it: any) => (it.id || '').toString().toLowerCase().includes(q));
    }

    // filter by status
    if (statusFilter !== 'All') {
      list = list.filter((it: any) => (it.status || '') === statusFilter);
    }

    // filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((it: any) => new Date(it.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // include entire day
      to.setHours(23,59,59,999);
      list = list.filter((it: any) => new Date(it.date) <= to);
    }

    // filter by broker when invoice
    if (type === 'Invoice' && brokerFilterText.trim()) {
      const q = brokerFilterText.trim().toLowerCase();
      list = list.filter((it: any) => {
        const brokerName = (it.brokerName || brokers.find((b: any) => b.id === it.brokerId)?.name || '').toString().toLowerCase();
        return brokerName.includes(q);
      });
    }

    return list;
  }, [sortedItems, brokerFilterText, brokers, type, nameFilterText, docFilterText, statusFilter, dateFrom, dateTo, customers, vendors]);

  // Print view moved to shared component PrintPreview

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Print Preview Modal */}
      {printingDoc && (
        <PrintPreview doc={printingDoc} type={type} customers={customers} vendors={vendors} inventory={inventory} onClose={() => setPrintingDoc(null)} />
      )}

      {/* Settle Modal */}
      {settlingItem && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-5 text-white font-black text-sm flex justify-between items-center tracking-widest uppercase">
              <span>{type === 'Bill' ? 'Purchase Payment' : 'Receive Funds'}</span>
              <button onClick={() => setSettlingItem(null)} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] font-bold">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">REFERENCE</span>
                  <span className="text-red-700">#{settlingItem.id}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-[14px] font-black">
                  <span className="text-slate-600">PENDING</span>
                  <span className="text-[#e53935]">PKR {(settlingItem.total - settlingItem.amountPaid).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Payment Method</label>
                  <div className="flex space-x-2">
                    {['Cash', 'Bank'].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setSettleMethod(m as PaymentMethod)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${settleMethod === m ? 'bg-[#7d2b3f] text-white border-[#7d2b3f]' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {settleMethod === 'Bank' && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                    <select value={settleBank} onChange={e => setSettleBank(e.target.value)} className="text-[10px] font-bold p-3 border border-slate-300 rounded-lg">
                      {PAK_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <input type="text" placeholder="TID" value={settleTid} onChange={e => setSettleTid(e.target.value)} className="text-[10px] font-bold p-3 border border-slate-300 rounded-lg outline-none focus:border-red-500"/>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Amount to Pay (PKR)</label>
                  <input 
                    type="number" autoFocus value={settleAmount}
                    onChange={e => setSettleAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-3 text-2xl font-black text-[#7d2b3f] shadow-inner outline-none text-right" 
                  />
                </div>
              </div>

              <button 
                onClick={handleConfirmSettle} 
                className="w-full py-4 text-xs font-black bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 uppercase tracking-widest active:scale-95 transition-all"
              >
                Submit Payment Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${type === 'Invoice' ? 'bg-green-600' : 'bg-[#7d2b3f]'}`}>
            <i className={`fas ${type === 'Invoice' ? 'fa-file-invoice-dollar' : 'fa-receipt'} text-xl`}></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">{type} Center</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{type === 'Bill' ? 'Accounts Payable' : 'Accounts Receivable'}</p>
          </div>
        </div>
        {!isCreating && (
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder={`Filter by ${type === 'Invoice' ? 'customer' : 'supplier'}...`}
              value={nameFilterText}
              onChange={e => setNameFilterText(e.target.value)}
              className="text-sm font-bold p-2 border border-slate-200 rounded-lg shadow-sm bg-white outline-none w-56"
            />
            <input
              type="text"
              placeholder="Filter by doc #..."
              value={docFilterText}
              onChange={e => setDocFilterText(e.target.value)}
              className="text-sm font-bold p-2 border border-slate-200 rounded-lg shadow-sm bg-white outline-none w-36"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-sm font-bold p-2 border border-slate-200 rounded-lg bg-white outline-none">
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm p-2 border border-slate-200 rounded-lg bg-white" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm p-2 border border-slate-200 rounded-lg bg-white" />
            {type === 'Invoice' && (
              <input
                type="text"
                placeholder="Filter by broker..."
                value={brokerFilterText}
                onChange={e => setBrokerFilterText(e.target.value)}
                className="text-sm font-bold p-2 border border-slate-200 rounded-lg shadow-sm bg-white outline-none w-56"
              />
            )}
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-[#7d2b3f] text-white px-6 py-2 rounded-xl text-[11px] font-black hover:bg-[#5a1f2d] transition-all duration-300 ease-in-out shadow-lg active:scale-95 transform uppercase tracking-widest"
            >
              <i className="fas fa-plus mr-2"></i> Create New {type}
            </button>
          </div>
        )}
      </div>

      {isCreating ? (
        <div className="p-8 bg-slate-100 flex-1 overflow-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-12 border-b-8 border-slate-50">
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h1 className="text-5xl font-black text-slate-200 uppercase tracking-tighter mb-1">{type === 'Bill' ? 'PURCHASE' : 'SALE'}</h1>
                  <p className="text-[12px] font-black text-[#7d2b3f] tracking-widest uppercase">HA FABRICS ERP SYSTEMS</p>
                  {type === 'Bill' && lineItems.length > 0 && (
                    <p className="text-[14px] font-black text-slate-600 mt-2">LOT #{lineItems[0].lotNumber}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-w-55 shadow-inner">
                   <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest"><span>ISSUE DATE</span> <span>DOC#</span></div>
                   <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{type === 'Invoice' ? 'CUSTOMER' : 'SUPPLIER SOURCE'}</label>
                    <select value={selectedEntityId} onChange={e => setSelectedEntityId(e.target.value)}
                      disabled={type === 'Bill' && lineItems.length > 0}
                      className={`w-full border-b-4 border-slate-100 py-3 text-xl font-black text-slate-800 outline-none bg-transparent hover:border-[#7d2b3f] transition-all ${type === 'Bill' && lineItems.length > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">-- Choose Party --</option>
                      {(type === 'Invoice' ? customers : vendors).map(e => <option key={e.id} value={e.id}>{e.name} (PKR {e.balance.toLocaleString()})</option>)}
                    </select>

                    {type === 'Invoice' && (
                      <div className="mt-6 space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Broker & Commission</label>
                        <select
                          value={selectedBrokerId}
                          onChange={e => setSelectedBrokerId(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-white text-[11px] font-bold shadow-sm"
                        >
                          <option value="">-- No Broker --</option>
                          {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>

                        {selectedBrokerId && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={commissionType}
                              onChange={e => setCommissionType(e.target.value as 'Percentage' | 'Fixed')}
                              className="border border-slate-200 rounded-xl p-3 bg-white text-[11px] font-bold shadow-sm"
                            >
                              <option value="Percentage">Percentage (%)</option>
                              <option value="Fixed">Fixed Amount</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={commissionValue || ''}
                              onChange={e => setCommissionValue(parseFloat(e.target.value) || 0)}
                              className="border border-slate-200 rounded-xl p-3 bg-white text-[11px] font-bold shadow-sm text-right"
                              placeholder={commissionType === 'Percentage' ? '0 - 100' : '0.00'}
                            />
                          </div>
                        )}

                        {selectedBrokerId && (
                          <p className="text-[10px] font-black text-[#7d2b3f]">
                            Commission Payable: PKR {calculatedCommission.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                 </div>
                 
                 <div className="bg-[#f0f3f6] p-6 rounded-2xl border border-slate-200 space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Settlement Method</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['Credit', 'Cash', 'Bank'].map(m => (
                         <button key={m} onClick={() => setCreationMethod(m as PaymentMethod)}
                           className={`py-2 text-[10px] font-black rounded-lg border transition-all ${creationMethod === m ? 'bg-[#7d2b3f] text-white border-[#7d2b3f] shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>

                    {creationMethod === 'Bank' && (
                       <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                          <select value={creationBank} onChange={e => setCreationBank(e.target.value)} className="text-[10px] font-bold p-3 border border-slate-300 rounded-lg bg-white shadow-sm">
                            {PAK_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <input type="text" placeholder="TID" value={creationTid} onChange={e => setCreationTid(e.target.value)} className="text-[10px] font-bold p-3 border border-slate-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#7d2b3f] shadow-sm"/>
                       </div>
                    )}

                    <div className="flex items-center space-x-4 pt-3 border-t border-slate-200">
                       <label className="text-[10px] font-black text-slate-400 uppercase">Paid Now (PKR)</label>
                       <input 
                         type="number" 
                         value={creationAmount || ''} 
                         onChange={e => setCreationAmount(parseFloat(e.target.value) || 0)}
                         disabled={creationMethod === 'Credit'}
                         className={`flex-1 text-lg font-black text-[#7d2b3f] p-3 border border-slate-300 rounded-xl bg-white shadow-inner text-right outline-none ${creationMethod === 'Credit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                         placeholder={creationMethod === 'Credit' ? 'N/A - Full Credit' : '0.00'}
                       />
                    </div>
                 </div>
              </div>
            </div>

            {/* DIFFERENT LAYOUTS FOR INVOICE vs BILL */}
            {type === 'Bill' ? (
              // BILL: READ-ONLY LOT ITEMS, NO ADD/REMOVE
              <div className="p-0">
                <div className="bg-[#7d2b3f]/10 p-6 border-b border-[#7d2b3f]/20">
                  <p className="text-[11px] font-black text-[#7d2b3f] uppercase tracking-widest mb-2">
                    <i className="fas fa-info-circle mr-2"></i> Purchase for Complete Lot - Items Cannot Be Modified
                  </p>
                  <p className="text-[10px] text-slate-600">All fabrics in this lot will be purchased together. Adjust payment method and notes below.</p>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#7d2b3f] text-white">
                    <tr>
                      <th className="p-6 uppercase font-black tracking-widest text-[10px]">Fabric Description</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Quantity (M)</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Unit Rate</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Extension</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(li => (
                      <tr key={li.id} className="border-b border-slate-100 bg-white">
                        <td className="p-6 font-bold text-slate-700">
                          <span className="text-[9px] bg-[#7d2b3f]/10 text-[#7d2b3f] px-2 py-1 rounded-md mr-3 font-black uppercase shadow-sm border border-[#7d2b3f]/20">{li.lotNumber}</span>
                          {li.type}
                        </td>
                        <td className="p-6 text-right font-mono text-slate-600">{li.meters.toFixed(2)}m</td>
                        <td className="p-6 text-right font-mono text-slate-600">PKR {li.price.toLocaleString()}</td>
                        <td className="p-6 text-right font-black text-slate-800">PKR {(li.meters * li.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // INVOICE: EDITABLE WITH ADD/REMOVE ITEMS
              <div className="p-0">
               <table className="w-full text-left text-xs">
                  <thead className="bg-[#7d2b3f] text-white">
                    <tr>
                      <th className="p-6 uppercase font-black tracking-widest text-[10px]">Fabric Description</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Quantity (M)</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Unit Rate</th>
                      <th className="p-6 text-right uppercase font-black tracking-widest text-[10px]">Extension</th>
                      <th className="p-6 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(li => (
                      <tr key={li.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">
                          {li.lotNumber && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded mr-2 font-black uppercase border border-slate-200">{li.lotNumber}</span>}
                          {li.type}
                        </td>
                        <td className="p-6 text-right font-mono text-slate-500">{li.meters.toFixed(2)}m</td>
                        <td className="p-6 text-right font-mono text-slate-500">PKR {li.price.toLocaleString()}</td>
                        <td className="p-6 text-right font-black text-slate-800">PKR {(li.meters * li.price).toLocaleString()}</td>
                        <td className="p-6 text-center">
                           <button onClick={() => setLineItems(lineItems.filter(i => i.id !== li.id))} className="text-red-200 hover:text-red-600 transition-colors"><i className="fas fa-trash-alt"></i></button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50">
                      <td className="p-6">
                        <select value={currentLineItem.itemId} onChange={e => {
                            const inv = inventory.find(i => i.id === e.target.value);
                            setCurrentLineItem({...currentLineItem, itemId: e.target.value, price: inv?.unitPrice || 0});
                          }}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-white text-[11px] font-bold shadow-sm"
                        >
                          <option value="">-- Add Fabric --</option>
                          {availableInventory.map(i => <option key={i.id} value={i.id}>{i.lotNumber} | {i.type} ({i.meters}m avail)</option>)}
                        </select>
                      </td>
                      <td className="p-6">
                         <input type="number" placeholder="Qty" value={currentLineItem.meters || ''} onChange={e => setCurrentLineItem({...currentLineItem, meters: parseFloat(e.target.value) || 0})}
                           className="w-full border border-slate-200 rounded-xl p-3 text-right bg-white text-[11px] font-bold shadow-sm" />
                      </td>
                      <td className="p-6">
                         <input type="number" placeholder="Rate" value={currentLineItem.price || ''} onChange={e => setCurrentLineItem({...currentLineItem, price: parseFloat(e.target.value) || 0})}
                           className="w-full border border-slate-200 rounded-xl p-3 text-right bg-white text-[11px] font-bold shadow-sm" />
                      </td>
                      <td className="p-6 text-right font-black text-[#7d2b3f]">PKR {(currentLineItem.meters * currentLineItem.price).toLocaleString()}</td>
                      <td className="p-6 text-center">
                         <button onClick={handleAddLineItem} className="w-10 h-10 rounded-full bg-[#7d2b3f] text-white hover:bg-[#5a1f2d] shadow-lg transition-all active:scale-90"><i className="fas fa-plus"></i></button>
                      </td>
                    </tr>
                  </tbody>
               </table>
              </div>
            )}

            <div className="p-12 flex justify-between items-start bg-slate-50/40">
               <div className="max-w-xs space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Due In (Days)</label>
                    <input 
                      type="number"
                      value={creationDueDays}
                      onChange={e => setCreationDueDays(parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                      className="w-full border border-slate-200 rounded-xl p-3 text-lg font-black text-[#7d2b3f] outline-none bg-white shadow-inner text-center"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 italic">Number of days from today (default: 30 days)</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Memo / Notes</label>
                    <textarea 
                      value={creationNotes}
                      onChange={e => setCreationNotes(e.target.value)}
                      className="w-full h-24 border border-slate-200 rounded-xl p-4 text-xs outline-none bg-white shadow-inner resize-none" 
                      placeholder="Enter terms, conditions, or internal notes..."
                    ></textarea>
                  </div>
               </div>
               <div className="min-w-80 space-y-6">
                  <div className="flex justify-between border-t border-slate-200 pt-6">
                     <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Document Total</span>
                     <span className="text-4xl font-black text-[#7d2b3f]">PKR {totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-10 flex space-x-4">
                     <button onClick={resetForm} className="flex-1 py-4 text-[10px] font-black text-slate-500 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 uppercase tracking-widest">Discard</button>
                     <button onClick={handleSave} className={`flex-1 py-4 text-[10px] font-black text-white rounded-xl shadow-xl transition-all transform active:scale-95 uppercase tracking-widest ${type === 'Invoice' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#7d2b3f] hover:bg-[#5a1f2d]'}`}>
                        Post Entry
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-[#f8fafc] sticky top-0 border-b border-slate-200 shadow-sm z-10">
              <tr>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest">Doc #</th>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Days Remaining</th>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest">{type === 'Invoice' ? 'Customer' : 'Supplier'}</th>
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest">Broker</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Settlement Log</th>
                <th className="p-5 text-right font-black text-slate-500 uppercase tracking-widest">Total Amount</th>
                <th className="p-5 text-right font-black text-slate-500 uppercase tracking-widest">Commission</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item: any) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = item.dueDate ? new Date(item.dueDate) : null;
                const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const isOverdue = item.status !== 'Paid' && daysRemaining !== null && daysRemaining < 0;
                return (
                <React.Fragment key={item.id}>
                  <tr className={`hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className={`p-5 font-black font-mono text-[10px] ${type === 'Invoice' ? 'text-green-700' : 'text-[#2b5797]'}`}>
                      {isOverdue && <i className="fas fa-exclamation-triangle text-red-600 mr-2" title="Overdue"></i>}
                      {item.id}
                    </td>
                    <td className="p-5 text-slate-600 font-bold">{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
                    <td className="p-5 text-center">
                      {item.status === 'Paid' ? (
                        <span className="text-green-600 font-black text-xs uppercase">Paid</span>
                      ) : daysRemaining !== null ? (
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-2xl font-black ${isOverdue ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                            {Math.abs(daysRemaining)}
                          </span>
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            {isOverdue ? 'Days Overdue' : 'Days Left'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-5 font-black text-slate-800 uppercase tracking-tighter">
                      {type === 'Invoice' ? customers.find(c => c.id === item.customerId)?.name : vendors.find(v => v.id === item.vendorId)?.name}
                    </td>
                    <td className="p-5 font-bold text-slate-600 uppercase tracking-tight">
                      {type === 'Invoice' ? (item.brokerName || brokers.find(b => b.id === item.brokerId)?.name || '-') : '-'}
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => setExpandedDocId(expandedDocId === item.id ? null : item.id)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${item.paymentHistory.length > 0 ? 'bg-blue-50 text-[#2b5797] hover:bg-blue-100 shadow-sm' : 'text-slate-300 border border-slate-100'}`}
                      >
                        {item.paymentHistory.length} Record(s) <i className={`fas fa-chevron-${expandedDocId === item.id ? 'up' : 'down'} ml-1`}></i>
                      </button>
                    </td>
                    <td className="p-5 font-black text-right text-slate-900">PKR {item.total.toLocaleString()}</td>
                    <td className="p-5 font-black text-right text-slate-700">
                      {type === 'Invoice' && item.commissionAmount ? `PKR ${item.commissionAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        item.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 
                        item.status === 'Partially Paid' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-center flex items-center justify-center space-x-6">
                      {item.status !== 'Paid' && (
                        <button onClick={() => handleOpenSettle(item)} className={`text-[9px] text-white px-4 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-md transition-all active:scale-95 ${type === 'Bill' ? 'bg-[#7d2b3f] hover:bg-[#5a1f2d]' : 'bg-green-600 hover:bg-green-700'}`}>
                          Settle
                        </button>
                      )}
                      <button onClick={() => handlePrint(item)} className="text-slate-400 hover:text-red-600 transition-colors text-lg"><i className="fas fa-print"></i></button>
                    </td>
                  </tr>
                  
                  {/* Expanded Payment Log Section */}
                  {expandedDocId === item.id && (
                    <tr>
                      <td colSpan={10} className="p-0 bg-blue-50/20 border-l-4 border-[#2b5797]">
                         <div className="p-5 animate-in slide-in-from-top-2 duration-300">
                            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-inner">
                               <div className="bg-blue-50 px-4 py-2 text-[10px] font-black text-[#2b5797] uppercase tracking-widest flex justify-between">
                                  <span>Full Payment Log (Settlements)</span>
                                  <span>Remaining: PKR {(item.total - item.amountPaid).toLocaleString()}</span>
                               </div>
                               <table className="w-full text-left text-[10px]">
                                  <thead className="bg-white text-slate-400">
                                     <tr>
                                        <th className="px-4 py-2 border-b">DATE</th>
                                        <th className="px-4 py-2 border-b">METHOD</th>
                                        <th className="px-4 py-2 border-b">REFERENCE (TID)</th>
                                        <th className="px-4 py-2 border-b text-right">AMOUNT PAID</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {item.paymentHistory.map((pay: PaymentRecord) => (
                                        <tr key={pay.id} className="border-b border-slate-50 last:border-0">
                                           <td className="px-4 py-2 font-bold text-slate-600">{pay.date ? new Date(pay.date).toLocaleDateString() : ''}</td>
                                           <td className="px-4 py-2">
                                              <span className={`px-2 py-0.5 rounded-sm font-black uppercase tracking-tighter ${pay.method === 'Cash' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                 {pay.method} {pay.bankName ? `(${pay.bankName})` : ''}
                                              </span>
                                           </td>
                                           <td className="px-4 py-2 font-mono text-slate-400">{pay.tid || 'N/A'}</td>
                                           <td className="px-4 py-2 text-right font-black text-slate-800">PKR {pay.amount.toLocaleString()}</td>
                                        </tr>
                                     ))}
                                     {item.paymentHistory.length === 0 && (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-300 italic">No payments recorded for this document yet.</td></tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
              })}
              {items.length === 0 && (
                <tr><td colSpan={10} className="p-40 text-center text-slate-300 italic uppercase font-black opacity-30 tracking-[10px]">No Documents Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceBillCenter;

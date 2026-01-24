
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Bill, Vendor, Customer, InventoryItem, PaymentMethod, PaymentRecord } from '../types';

interface InvoiceBillCenterProps {
  type: 'Invoice' | 'Bill';
  items: (Invoice | Bill)[];
  onAdd: (item: any) => void;
  vendors: Vendor[];
  customers: Customer[];
  inventory: InventoryItem[];
  preFilledItem: InventoryItem | null;
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
  type, items, onAdd, vendors, customers, inventory, preFilledItem, onPayBill, onReceivePayment 
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
  const [currentLineItem, setCurrentLineItem] = useState({ itemId: '', meters: 0, price: 0 });

  // Settlement Modal States
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('Cash');
  const [settleBank, setSettleBank] = useState(PAK_BANKS[0]);
  const [settleTid, setSettleTid] = useState('');

  useEffect(() => {
    if (preFilledItem && type === 'Bill') {
      setIsCreating(true);
      setSelectedEntityId(preFilledItem.vendorId);
      setLineItems([{
        id: `li-${Date.now()}`,
        itemId: preFilledItem.id,
        meters: preFilledItem.meters,
        price: preFilledItem.unitPrice,
        lotNumber: preFilledItem.lotNumber,
        type: preFilledItem.type
      }]);
    }
  }, [preFilledItem, type]);

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
    if (creationAmount > 0 && creationAmount > totalAmountNow) {
      try { window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Initial payment cannot exceed document total', level: 'error' } })); } catch {}
      return;
    }

    const initialPayment: PaymentRecord | null = (creationMethod !== 'Credit' && creationAmount > 0) ? {
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
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      items: lineItems.map(li => ({ itemId: li.itemId, meters: li.meters, price: li.price })),
      total: totalAmount,
      amountPaid: initialPayment ? creationAmount : 0,
      paymentHistory: initialPayment ? [initialPayment] : [],
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

  const PrintView = ({ doc }: { doc: any }) => {
    const entity = type === 'Invoice' 
      ? customers.find(c => c.id === doc.customerId) 
      : vendors.find(v => v.id === doc.vendorId);

    return (
      <div className="fixed inset-0 bg-slate-800/90 z-[70] flex flex-col items-center justify-start p-10 overflow-auto custom-scrollbar no-print">
        <div className="flex justify-between w-full max-w-4xl mb-6">
           <button onClick={() => setPrintingDoc(null)} className="bg-white/10 text-white px-6 py-2 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20 uppercase tracking-widest text-[10px]">
             <i className="fas fa-arrow-left mr-2"></i> Back to ERP
           </button>
           <button onClick={() => window.print()} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-500 transition-all shadow-xl uppercase tracking-widest text-[10px]">
             <i className="fas fa-print mr-2"></i> Print to PDF / Printer
           </button>
        </div>
        
        <div id="printable-area" className="w-full max-w-4xl bg-white p-12 shadow-2xl rounded-sm border border-slate-200">
           {/* Header Branding */}
           <div className="flex justify-between items-start border-b-2 border-slate-800 pb-10 mb-10">
              <div className="flex items-center space-x-4">
                 <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white rounded-xl">
                   <i className="fas fa-leaf text-3xl"></i>
                 </div>
                 <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">HA FABRICS</h1>
                    <p className="text-[10px] font-black text-slate-400 tracking-[3px] uppercase">Enterprise Fabric Solutions</p>
                 </div>
              </div>
              <div className="text-right">
                 <h2 className="text-5xl font-black text-slate-200 uppercase tracking-tighter -mt-2 mb-2">{type}</h2>
                 <p className="text-xs font-black text-slate-800">DOCUMENT ID: <span className="font-mono">{doc.id}</span></p>
              </div>
           </div>

           {/* Entity & Details */}
           <div className="grid grid-cols-2 gap-16 mb-16">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{type === 'Invoice' ? 'BILL TO' : 'VENDOR SOURCE'}</p>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-800 uppercase">{entity?.name || 'Unknown Party'}</p>
                    <p className="text-sm text-slate-500 font-medium">Contact: {entity?.contact || 'N/A'}</p>
                    <p className="text-sm text-slate-500 font-medium">{entity?.address || 'No registered address on file.'}</p>
                 </div>
              </div>
              <div className="bg-slate-50 p-6 border border-slate-100 rounded-xl grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE ISSUED</p>
                      <p className="text-xs font-black text-slate-800">{doc.date ? new Date(doc.date).toLocaleDateString() : ''}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DUE DATE</p>
                      <p className="text-xs font-black text-slate-800">{doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
                 </div>
                 <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CURRENT STATUS</p>
                    <p className={`text-xs font-black uppercase ${doc.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{doc.status}</p>
                 </div>
              </div>
           </div>

           {/* Table */}
           <table className="w-full text-left mb-16">
              <thead className="border-b-2 border-slate-800">
                 <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="py-4">Item Description</th>
                    <th className="py-4 text-right">Qty (M)</th>
                    <th className="py-4 text-right">Unit Rate</th>
                    <th className="py-4 text-right">Amount (PKR)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {doc.items.map((it: any, idx: number) => {
                    const inv = inventory.find(i => i.id === it.itemId);
                    return (
                       <tr key={idx}>
                          <td className="py-6 font-bold text-slate-800">
                             {/* HIDE LOT NUMBERS ON INVOICES FOR CLIENTS */}
                             {type !== 'Invoice' && (
                                <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-sm mr-3 font-black text-slate-500">#{inv?.lotNumber || 'N/A'}</span>
                             )}
                             {inv?.type || 'Standard Fabric'}
                          </td>
                          <td className="py-6 text-right font-mono text-slate-600">{it.meters.toFixed(2)}m</td>
                          <td className="py-6 text-right font-mono text-slate-600">{it.price.toLocaleString()}</td>
                          <td className="py-6 text-right font-black text-slate-800">{(it.meters * it.price).toLocaleString()}</td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>

           {/* Totals */}
           <div className="flex justify-between items-start mb-20">
              <div className="w-1/2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Notes</p>
                 <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    All fabrics are subject to strict quality control. Refunds only accepted within 7 days of delivery in original condition. 
                    Bank transfers should include document ID as reference.
                 </p>
              </div>
              <div className="w-1/3 space-y-3">
                 <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>PKR {doc.total.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Amount Paid</span>
                    <span className="text-green-600">- PKR {doc.amountPaid.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between pt-4 border-t-2 border-slate-800 text-lg font-black text-slate-800 uppercase tracking-tighter">
                    <span>Total Balance</span>
                    <span>PKR {(doc.total - doc.amountPaid).toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Footer Signatures */}
           <div className="flex justify-between pt-16 border-t border-slate-100 mt-20">
              <div className="w-48 border-t border-slate-300 text-center pt-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Signature</p>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-400 italic">Thank you for choosing HA FABRICS</p>
              </div>
              <div className="w-48 border-t border-slate-300 text-center pt-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized By</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Print Preview Modal */}
      {printingDoc && <PrintView doc={printingDoc} />}

      {/* Settle Modal */}
      {settlingItem && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-5 text-white font-black text-sm flex justify-between items-center tracking-widest uppercase">
              <span>{type === 'Bill' ? 'Bill Payment' : 'Receive Funds'}</span>
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
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#7d2b3f] text-white px-8 py-3 rounded-xl text-[11px] font-black hover:bg-[#5a1f2d] transition-all duration-300 ease-in-out shadow-lg active:scale-95 transform uppercase tracking-widest"
          >
            <i className="fas fa-plus mr-2"></i> Create New {type}
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="p-8 bg-slate-100 flex-1 overflow-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-12 border-b-8 border-slate-50">
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h1 className="text-5xl font-black text-slate-200 uppercase tracking-tighter mb-1">{type}</h1>
                  <p className="text-[12px] font-black text-[#7d2b3f] tracking-widest uppercase">HA FABRICS ERP SYSTEMS</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-w-[220px] shadow-inner">
                   <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest"><span>ISSUE DATE</span> <span>DOC#</span></div>
                   <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{type === 'Invoice' ? 'CUSTOMER' : 'VENDOR SOURCE'}</label>
                    <select value={selectedEntityId} onChange={e => setSelectedEntityId(e.target.value)}
                      className="w-full border-b-4 border-slate-100 py-3 text-xl font-black text-slate-800 outline-none bg-transparent hover:border-[#2b5797] transition-all"
                    >
                      <option value="">-- Choose Party --</option>
                      {(type === 'Invoice' ? customers : vendors).map(e => <option key={e.id} value={e.id}>{e.name} (PKR {e.balance.toLocaleString()})</option>)}
                    </select>
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
                       <input type="number" value={creationAmount || ''} onChange={e => setCreationAmount(parseFloat(e.target.value) || 0)}
                         className="flex-1 text-lg font-black text-[#7d2b3f] p-3 border border-slate-300 rounded-xl bg-white shadow-inner text-right outline-none" placeholder="0.00"
                       />
                    </div>
                 </div>
              </div>
            </div>

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
                           {/* HIDE LOT NAME FOR CLIENT INVOICES */}
                           {type !== 'Invoice' && (
                             <span className="text-[9px] bg-blue-50 text-[#2b5797] px-2 py-1 rounded-md mr-3 font-black uppercase shadow-sm border border-blue-100">{li.lotNumber}</span>
                           )}
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
                    <tr className="bg-blue-50/20">
                      <td className="p-6">
                        <select value={currentLineItem.itemId} onChange={e => {
                            const inv = inventory.find(i => i.id === e.target.value);
                            setCurrentLineItem({...currentLineItem, itemId: e.target.value, price: inv?.unitPrice || 0});
                          }}
                          className="w-full border border-slate-200 rounded-xl p-3 bg-white text-[11px] font-bold shadow-sm"
                        >
                          <option value="">-- Add Fabric --</option>
                          {availableInventory.map(i => <option key={i.id} value={i.id}>{i.lotNumber} - {i.type} ({i.meters}m avail)</option>)}
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

            <div className="p-12 flex justify-between items-start bg-slate-50/40">
               <div className="max-w-xs space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Memo</label>
                  <textarea className="w-full h-24 border border-slate-200 rounded-xl p-4 text-xs outline-none bg-white shadow-inner resize-none" placeholder="Enter terms, conditions, or internal notes..."></textarea>
               </div>
               <div className="min-w-[320px] space-y-6">
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
                <th className="p-5 font-black text-slate-500 uppercase tracking-widest">{type === 'Invoice' ? 'Customer' : 'Vendor'}</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Settlement Log</th>
                <th className="p-5 text-right font-black text-slate-500 uppercase tracking-widest">Total Amount</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-5 text-center font-black text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item: any) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className={`p-5 font-black font-mono text-[10px] ${type === 'Invoice' ? 'text-green-700' : 'text-[#2b5797]'}`}>{item.id}</td>
                    <td className="p-5 text-slate-600 font-bold">{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
                    <td className="p-5 font-black text-slate-800 uppercase tracking-tighter">
                      {type === 'Invoice' ? customers.find(c => c.id === item.customerId)?.name : vendors.find(v => v.id === item.vendorId)?.name}
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
                      <td colSpan={7} className="p-0 bg-blue-50/20 border-l-4 border-[#2b5797]">
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
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="p-40 text-center text-slate-300 italic uppercase font-black opacity-30 tracking-[10px]">No Documents Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceBillCenter;

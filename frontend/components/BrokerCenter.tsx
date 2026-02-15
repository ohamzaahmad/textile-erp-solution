import React, { useMemo, useState } from 'react';
import { Broker, Invoice, Customer } from '../types';
import { emitToast } from '../api';

const BANK_OPTIONS = ['Meezan Bank', 'HBL', 'UBL', 'MCB', 'Allied Bank', 'Bank Alfalah', 'Askari Bank', 'Faysal Bank', 'JS Bank', 'Standard Chartered', 'National Bank'];

interface BrokerCenterProps {
  brokers: Broker[];
  invoices: Invoice[];
  customers: Customer[];
  onAddBroker: (broker: Broker) => Promise<Broker | null>;
  onUpdateBroker: (broker: Broker) => Promise<Broker | null>;
  onDeleteBroker: (brokerId: string) => Promise<boolean>;
  onSettleCommission: (invoiceId: string, paymentData: { date: string; amount: number; method: string; bank_name?: string; tid?: string }) => Promise<boolean>;
  onNavigate: (page: string, id?: string) => void;
}

const BrokerCenter: React.FC<BrokerCenterProps> = ({
  brokers, invoices, customers, onAddBroker, onUpdateBroker, onDeleteBroker, onSettleCommission, onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(brokers[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settlingInvoiceId, setSettlingInvoiceId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'Cash' | 'Bank'>('Cash');
  const [payBankName, setPayBankName] = useState(BANK_OPTIONS[0]);
  const [payTid, setPayTid] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const [newBroker, setNewBroker] = useState<Broker>({ id: '', name: '', contact: '', address: '' });
  const [editBroker, setEditBroker] = useState<Broker | null>(null);

  const filteredBrokers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return brokers;
    return brokers.filter(b =>
      (b.name || '').toLowerCase().includes(term) ||
      (b.contact || '').toLowerCase().includes(term)
    );
  }, [brokers, searchTerm]);

  const selectedBroker = brokers.find(b => b.id === selectedBrokerId) || null;

  // Invoices linked to the selected broker
  const brokerInvoices = useMemo(() => {
    if (!selectedBrokerId) return [];
    return invoices.filter(inv => inv.brokerId === selectedBrokerId && (inv.commissionAmount || 0) > 0);
  }, [invoices, selectedBrokerId]);

  // Commission stats for selected broker
  const commissionStats = useMemo(() => {
    const totalCommission = brokerInvoices.reduce((acc, inv) => acc + (inv.commissionAmount || 0), 0);
    const paidCommission = brokerInvoices.reduce((acc, inv) => acc + (inv.commissionPaid || 0), 0);
    const pendingCommission = totalCommission - paidCommission;
    const pendingCount = brokerInvoices.filter(inv => (inv.commissionPaid || 0) < (inv.commissionAmount || 0)).length;
    return { totalCommission, paidCommission, pendingCommission, pendingCount };
  }, [brokerInvoices]);

  // Commission stats for sidebar list
  const brokerPendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.brokerId && (inv.commissionAmount || 0) > 0) {
        const remaining = (inv.commissionAmount || 0) - (inv.commissionPaid || 0);
        if (remaining > 0) {
          map[inv.brokerId] = (map[inv.brokerId] || 0) + remaining;
        }
      }
    });
    return map;
  }, [invoices]);

  const handleCreate = async () => {
    if (!newBroker.name.trim()) {
      alert('Broker name is required');
      return;
    }
    const created = await onAddBroker({
      id: '',
      name: newBroker.name.trim(),
      contact: (newBroker.contact || '').trim(),
      address: (newBroker.address || '').trim(),
    });
    if (created) {
      setSelectedBrokerId(created.id);
      setNewBroker({ id: '', name: '', contact: '', address: '' });
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editBroker || !editBroker.name.trim()) {
      alert('Broker name is required');
      return;
    }
    const updated = await onUpdateBroker({
      id: editBroker.id,
      name: editBroker.name.trim(),
      contact: (editBroker.contact || '').trim(),
      address: (editBroker.address || '').trim(),
    });
    if (updated) {
      setSelectedBrokerId(updated.id);
      setIsEditing(false);
      setEditBroker(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBroker) return;
    if (!window.confirm(`Delete broker "${selectedBroker.name}"? This will fail if invoices are linked.`)) return;
    const ok = await onDeleteBroker(selectedBroker.id);
    if (ok) {
      const next = brokers.filter(b => b.id !== selectedBroker.id);
      setSelectedBrokerId(next[0]?.id || null);
    }
  };

  const handleConfirmSettle = async () => {
    if (!settlingInvoiceId) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const inv = brokerInvoices.find(i => i.id === settlingInvoiceId);
    const remaining = (inv?.commissionAmount || 0) - (inv?.commissionPaid || 0);
    if (amt > remaining) {
      alert(`Amount cannot exceed remaining commission (PKR ${remaining.toLocaleString()})`);
      return;
    }
    const paymentData: any = {
      date: new Date().toISOString().slice(0, 10),
      amount: amt,
      method: payMethod,
    };
    if (payMethod === 'Bank') {
      paymentData.bank_name = payBankName;
      paymentData.tid = payTid;
    }
    const ok = await onSettleCommission(settlingInvoiceId, paymentData);
    if (ok) {
      emitToast('Commission payment recorded', 'success');
    }
    setSettlingInvoiceId(null);
    setPayAmount('');
    setPayMethod('Cash');
    setPayTid('');
  };

  const openSettleModal = (inv: Invoice) => {
    const remaining = (inv.commissionAmount || 0) - (inv.commissionPaid || 0);
    setSettlingInvoiceId(inv.id);
    setPayAmount(String(remaining));
    setPayMethod('Cash');
    setPayBankName(BANK_OPTIONS[0]);
    setPayTid('');
  };

  const settlingInvoice = settlingInvoiceId ? brokerInvoices.find(inv => inv.id === settlingInvoiceId) : null;

  return (
    <div className="flex h-full bg-[#f0f3f6] rounded border border-[#a3b6cc] overflow-hidden shadow-2xl">

      {/* New Broker Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Add New Broker</span>
              <button onClick={() => setIsCreating(false)} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Broker Name</label>
                  <input type="text" value={newBroker.name} onChange={e => setNewBroker({ ...newBroker, name: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="Enter broker name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Contact Phone</label>
                  <input type="text" value={newBroker.contact || ''} onChange={e => setNewBroker({ ...newBroker, contact: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="03xx-xxxxxxx" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Address</label>
                  <input type="text" value={newBroker.address || ''} onChange={e => setNewBroker({ ...newBroker, address: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" placeholder="Street, City" />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleCreate} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save Broker</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Broker Modal */}
      {isEditing && editBroker && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Edit Broker</span>
              <button onClick={() => { setIsEditing(false); setEditBroker(null); }} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Broker Name</label>
                  <input type="text" value={editBroker.name} onChange={e => setEditBroker({ ...editBroker, name: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Contact Phone</label>
                  <input type="text" value={editBroker.contact || ''} onChange={e => setEditBroker({ ...editBroker, contact: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Address</label>
                  <input type="text" value={editBroker.address || ''} onChange={e => setEditBroker({ ...editBroker, address: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t">
                <button onClick={() => { setIsEditing(false); setEditBroker(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleSaveEdit} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle Commission Modal */}
      {settlingInvoice && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-4 text-white font-bold text-sm flex justify-between items-center">
              <span>Pay Commission</span>
              <button onClick={() => setSettlingInvoiceId(null)} className="hover:text-red-200"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] font-bold space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">REFERENCE</span>
                  <span className="text-[#7d2b3f]">#{settlingInvoice.id}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-[14px] font-black">
                  <span className="text-slate-600">{(settlingInvoice.commissionPaid || 0) > 0 ? 'REMAINING' : 'PENDING'}</span>
                  <span className="text-[#e53935]">PKR {((settlingInvoice.commissionAmount || 0) - (settlingInvoice.commissionPaid || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPayMethod('Cash')} className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${payMethod === 'Cash' ? 'bg-white border-slate-300 text-slate-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>Cash</button>
                  <button onClick={() => setPayMethod('Bank')} className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${payMethod === 'Bank' ? 'bg-[#7d2b3f] border-[#7d2b3f] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>Bank</button>
                </div>
              </div>

              {payMethod === 'Bank' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select value={payBankName} onChange={e => setPayBankName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none bg-white">
                      {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="text" placeholder="TID" value={payTid} onChange={e => setPayTid(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none" />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Amount to Pay (PKR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-4 text-2xl font-black text-right outline-none"
                  min="0"
                  max={(settlingInvoice.commissionAmount || 0) - (settlingInvoice.commissionPaid || 0)}
                />
              </div>

              <button
                onClick={handleConfirmSettle}
                className="w-full py-3.5 text-xs font-black bg-green-500 text-white rounded-lg uppercase tracking-widest shadow-lg hover:bg-green-600 active:scale-95 transition-all"
              >
                Submit Payment Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-70 bg-white border-r border-[#a3b6cc] flex flex-col shrink-0">
        <div className="p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase whitespace-nowrap">Active Brokers</span>
            <button onClick={() => setIsCreating(true)} className="text-[10px] font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm whitespace-nowrap">New Broker</button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-xs p-2 pl-9 border border-[#7d2b3f]/60 rounded-sm outline-none shadow-inner" />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-[10px]"></i>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredBrokers.map(b => {
            const pending = brokerPendingMap[b.id] || 0;
            return (
              <div key={b.id} onClick={() => setSelectedBrokerId(b.id)} className={`p-3 border-b border-[#e1e8ef] cursor-pointer transition-all flex justify-between items-center group ${selectedBrokerId === b.id ? 'bg-[#7d2b3f] text-white shadow-md' : 'hover:bg-slate-50'}`}>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[12px] font-bold truncate ${selectedBrokerId === b.id ? 'text-white' : 'text-[#7d2b3f]'}`}>{b.name}</span>
                  <span className={`text-[10px] ${selectedBrokerId === b.id ? 'text-red-100' : 'text-slate-400'}`}>{b.contact || 'No contact'}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className={`text-[11px] font-black ${selectedBrokerId === b.id ? 'text-white' : (pending > 0 ? 'text-red-600' : 'text-green-600')}`}>
                    {pending > 0 ? pending.toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredBrokers.length === 0 && (
            <div className="p-6 text-center text-slate-300 text-xs italic">No brokers found</div>
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedBroker ? (
          <>
            {/* Header */}
            <div className="p-10 border-b border-[#e1e8ef] bg-white flex justify-between items-start">
              <div className="space-y-3">
                <h2 className="text-4xl font-light text-slate-400 tracking-tight">Broker Information</h2>
                <div className="pt-2 space-y-2">
                  <p className="text-xl font-bold text-slate-800 uppercase tracking-tighter">{selectedBroker.name}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 font-medium flex items-center">
                      <i className="fas fa-phone mr-2 text-slate-400"></i> {selectedBroker.contact || 'No contact provided'}
                    </p>
                    {selectedBroker.address && (
                      <p className="text-sm text-slate-600 font-medium flex items-center">
                        <i className="fas fa-map-marker-alt mr-2 text-slate-400"></i> {selectedBroker.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Outstanding Commission</span>
                <p className={`text-5xl font-black mt-2 leading-none ${commissionStats.pendingCommission > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  PKR {commissionStats.pendingCommission.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                  {commissionStats.pendingCount} unsettled &bull; {brokerInvoices.length} total
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-b border-[#e1e8ef] bg-white text-right space-x-2">
              <button
                onClick={() => { setEditBroker({ ...selectedBroker }); setIsEditing(true); }}
                className="px-4 py-1 text-xs font-bold bg-[#7d2b3f] text-white rounded"
              >
                Edit Broker
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1 text-xs font-bold bg-red-600 text-white rounded"
              >
                Delete Broker
              </button>
            </div>

            {/* Tab Area - Commission Invoices */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-6 flex space-x-10 border-b border-[#e1e8ef]">
                <button className="pb-4 text-[13px] font-black uppercase tracking-widest border-b-4 border-[#2b5797] text-[#2b5797] transition-all">
                  Commission Invoices
                </button>
              </div>

              <div className="flex-1 p-8 overflow-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Commission</p>
                    <p className="text-2xl font-black text-slate-800">PKR {commissionStats.totalCommission.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Paid</p>
                    <p className="text-2xl font-black text-green-700">PKR {commissionStats.paidCommission.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-2xl font-black text-red-700">PKR {commissionStats.pendingCommission.toLocaleString()}</p>
                  </div>
                </div>

                {/* Commission Table */}
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-[#e1e8ef] uppercase font-black text-[10px]">
                      <th className="pb-4">Invoice Date</th>
                      <th className="pb-4">Invoice #</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4 text-right">Invoice Total</th>
                      <th className="pb-4 text-center">Type</th>
                      <th className="pb-4 text-right">Commission</th>
                      <th className="pb-4 text-right">Paid</th>
                      <th className="pb-4 text-right">Remaining</th>
                      <th className="pb-4 text-center">Status</th>
                      <th className="pb-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {brokerInvoices.map(inv => {
                      const customerName = customers.find(c => c.id === inv.customerId)?.name || inv.customerId;
                      const commAmt = inv.commissionAmount || 0;
                      const commPaid = inv.commissionPaid || 0;
                      const commRemaining = commAmt - commPaid;
                      const isFullyPaid = commRemaining <= 0;
                      const isPartial = commPaid > 0 && !isFullyPaid;
                      return (
                        <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${!isFullyPaid ? 'bg-red-50/30' : ''}`}>
                          <td className="py-4 text-slate-600 font-bold">{inv.date ? new Date(inv.date).toLocaleDateString() : ''}</td>
                          <td className="py-4">
                            <button
                              onClick={() => onNavigate('invoices', inv.id)}
                              className="font-mono text-[10px] text-green-700 hover:text-green-900 hover:underline font-bold cursor-pointer"
                              title="Go to invoice"
                            >
                              <i className="fas fa-external-link-alt mr-1 text-[8px]"></i>
                              {inv.id}
                            </button>
                          </td>
                          <td className="py-4 font-bold text-slate-800 uppercase tracking-tighter">{customerName}</td>
                          <td className="py-4 text-right text-slate-500 font-bold">PKR {inv.total.toLocaleString()}</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-0.5 rounded-sm text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                              {inv.commissionType === 'Percentage' ? `${inv.commissionValue}%` : 'Fixed'}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-[#7d2b3f]">PKR {commAmt.toLocaleString()}</td>
                          <td className="py-4 text-right font-bold text-green-600">{commPaid > 0 ? `PKR ${commPaid.toLocaleString()}` : '-'}</td>
                          <td className="py-4 text-right font-bold text-red-600">{commRemaining > 0 ? `PKR ${commRemaining.toLocaleString()}` : '-'}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase border ${isFullyPaid ? 'bg-green-100 text-green-700 border-green-200' : isPartial ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {isFullyPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            {!isFullyPaid && (
                              <button
                                onClick={() => openSettleModal(inv)}
                                className="bg-[#7d2b3f] text-white px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-[#5a1f2d] active:scale-95 transition-all"
                              >
                                Pay
                              </button>
                            )}
                            {isFullyPaid && (
                              <span className="text-green-600 text-[10px] font-black"><i className="fas fa-check-circle"></i></span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {brokerInvoices.length === 0 && (
                      <tr><td colSpan={10} className="py-20 text-center text-slate-300 italic">No commission invoices found for this broker.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-[#f8f9fa]">
            <i className="fas fa-user-tie text-7xl mb-6 opacity-30"></i>
            <p className="text-xl font-black italic text-slate-500 opacity-60 uppercase tracking-widest">Select a broker</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerCenter;

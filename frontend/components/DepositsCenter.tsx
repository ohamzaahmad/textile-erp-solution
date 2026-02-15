
import React from 'react';
import { Invoice, Bill, PaymentRecord, Broker } from '../types';

interface DepositsCenterProps {
  invoices: Invoice[];
  bills: Bill[];
  brokers: Broker[];
}

const DepositsCenter: React.FC<DepositsCenterProps> = ({ invoices, bills, brokers }) => {
  // Aggregate all payments from invoices, bills, and commission settlements
  const allPayments: (PaymentRecord & { source: string; partyName: string; type: 'Incoming' | 'Outgoing' })[] = [];

  invoices.forEach(inv => {
    inv.paymentHistory.forEach(pay => {
      allPayments.push({ ...pay, source: `Sale #${inv.id}`, partyName: 'Customer Payment', type: 'Incoming' });
    });
    // Commission payments to brokers
    (inv.commissionPayments || []).forEach(cp => {
      const brokerName = brokers.find(b => b.id === inv.brokerId)?.name || 'Broker';
      allPayments.push({ ...cp, source: `Commission - Sale #${inv.id}`, partyName: `Broker: ${brokerName}`, type: 'Outgoing' });
    });
  });

  bills.forEach(bill => {
    bill.paymentHistory.forEach(pay => {
      allPayments.push({ ...pay, source: `Purchase #${bill.id}`, partyName: 'Supplier Settlement', type: 'Outgoing' });
    });
  });

  const bankPayments = allPayments.filter(p => p.method === 'Bank');
  const cashPayments = allPayments.filter(p => p.method === 'Cash');

  const PaymentTable = ({ title, payments, color }: { title: string, payments: typeof allPayments, color: string }) => (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
      <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${color}`}>
        <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        <span className="text-[10px] font-black bg-white/20 text-white px-3 py-1 rounded-full">{payments.length} Transactions</span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
          <tr className="uppercase font-black text-[9px] tracking-widest">
            <th className="p-4">Date</th>
            <th className="p-4">Source</th>
            <th className="p-4">Type</th>
            <th className="p-4">Bank/TID</th>
            <th className="p-4 text-right">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {payments.length > 0 ? payments.map(p => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors duration-200">
              <td className="p-4 font-bold text-slate-600">{p.date}</td>
              <td className="p-4 font-black text-[#7d2b3f]">{p.source}</td>
              <td className="p-4">
                <span className={`px-2 py-0.5 rounded-sm font-black text-[8px] uppercase ${p.type === 'Incoming' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.type}
                </span>
              </td>
              <td className="p-4 text-slate-500 italic">
                {p.bankName ? `${p.bankName} - ` : ''}{p.tid || 'N/A'}
              </td>
              <td className={`p-4 text-right font-black ${p.type === 'Incoming' ? 'text-green-600' : 'text-red-600'}`}>
                {p.type === 'Incoming' ? '+' : '-'} {p.amount.toLocaleString()}
              </td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="p-12 text-center text-slate-300 italic">No {title.toLowerCase()} recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-building-columns text-xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Transaction Deposits</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cash & Bank Reconciliation</p>
        </div>
      </div>

      <PaymentTable title="Bank Transactions" payments={bankPayments} color="bg-red-600" />
      <PaymentTable title="Cash Transactions" payments={cashPayments} color="bg-green-600" />
    </div>
  );
};

export default DepositsCenter;

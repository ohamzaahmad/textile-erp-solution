
import React, { useMemo, useState } from 'react';
import { Invoice, Bill, Expense, Vendor, Customer, Broker } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsCenterProps {
  invoices: Invoice[];
  bills: Bill[];
  expenses: Expense[];
  vendors: Vendor[];
  customers: Customer[];
  brokers: Broker[];
  onNavigate?: (page: 'vendors' | 'customers' | 'brokers', id?: string) => void;
}

const ReportsCenter: React.FC<ReportsCenterProps> = ({ invoices, bills, expenses, vendors, customers, brokers, onNavigate }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');

  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

  const getRange = (p: 'daily' | 'weekly' | 'monthly' | 'all') => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;
    if (p === 'all') {
      start = new Date(-8640000000000000);
      return { start, end: new Date(8640000000000000) };
    }
    if (p === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (p === 'weekly') {
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else {
      // monthly => last 30 days
      start = new Date(end);
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }
    return { start, end };
  };

  const range = useMemo(() => getRange(period), [period]);

  // Pre-filter datasets according to selected period so summaries and lists match
  const filteredInvoices = useMemo(() => invoices.filter((inv: any) => inv.date && new Date(inv.date) >= range.start && new Date(inv.date) <= range.end), [invoices, range]);
  const filteredBills = useMemo(() => bills.filter((bill: any) => bill.date && new Date(bill.date) >= range.start && new Date(bill.date) <= range.end), [bills, range]);
  const filteredExpenses = useMemo(() => expenses.filter((exp: any) => exp.date && new Date(exp.date) >= range.start && new Date(exp.date) <= range.end), [expenses, range]);

  // Compute totals based on filtered datasets so the summary cards reflect the selected period
  const totalSales = filteredInvoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalBillExpenses = filteredBills.reduce((acc, curr) => acc + curr.total, 0);
  const totalOperationalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpenses = totalBillExpenses + totalOperationalExpenses;
  const totalCommission = filteredInvoices.reduce((acc, inv) => acc + (inv.commissionAmount || 0), 0);
  const totalCommissionPaid = filteredInvoices.reduce((acc, inv) => acc + (inv.commissionPaid || 0), 0);
  const totalCommissionOutstanding = totalCommission - totalCommissionPaid;
  const netProfit = totalSales - totalExpenses - totalCommissionPaid;

  const data = [
    { name: 'Total Sales', amount: totalSales },
    { name: 'Total Expenses', amount: totalExpenses },
    { name: 'Net Profit', amount: netProfit },
  ];

  const downloadCsv = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportBalanceSheet = () => {
    // Recreate the receivable/payable/commission items using the same logic and range
    const receivableItems = invoices
      .map(inv => ({
        date: inv.date || '',
        type: 'RECEIVABLE',
        reference: inv.id,
        partyId: inv.customerId,
        party: (customers.find(c => c.id === String(inv.customerId))?.name) || inv.customerId,
        amount: Math.max(0, inv.total - (inv.amountPaid || 0)),
        isIncome: true
      }))
      .filter(i => i.amount > 0)
      .filter(i => !!i.date && new Date(i.date) >= range.start && new Date(i.date) <= range.end);

    const payableItems = bills
      .map(bill => ({
        date: bill.date || '',
        type: 'PAYABLE',
        reference: bill.id,
        partyId: bill.vendorId,
        party: (vendors.find(v => v.id === String(bill.vendorId))?.name) || bill.vendorId,
        amount: Math.max(0, bill.total - (bill.amountPaid || 0)),
        isIncome: false
      }))
      .filter(b => b.amount > 0)
      .filter(b => !!b.date && new Date(b.date) >= range.start && new Date(b.date) <= range.end);

    const commissionItems = invoices
      .filter(inv => inv.brokerId && (inv.commissionAmount || 0) > (inv.commissionPaid || 0))
      .map(inv => ({
        date: inv.date || '',
        type: 'COMMISSION',
        reference: `Inv #${inv.id}`,
        partyId: inv.brokerId || '',
        party: brokers.find(b => b.id === inv.brokerId)?.name || 'Broker',
        amount: Math.max(0, (inv.commissionAmount || 0) - (inv.commissionPaid || 0)),
        isIncome: false
      }))
      .filter(c => !!c.date && new Date(c.date) >= range.start && new Date(c.date) <= range.end);

    const combined = [...receivableItems, ...payableItems, ...commissionItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const rows = combined.map(it => {
      running += it.isIncome ? it.amount : -it.amount;
      return {
        date: it.date,
        type: it.type,
        reference: it.reference,
        party: it.party,
        amount: it.amount,
        runningBalance: running
      };
    });

    // CSV header
    const header = ['Date', 'Type', 'Reference', 'Party', 'Amount', 'Running Balance'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const line = [r.date, r.type, String(r.reference), (r.party || ''), String(r.amount), String(r.runningBalance)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      lines.push(line);
    });

    const csv = lines.join('\n');
    downloadCsv(`balance-sheet-${period}.csv`, csv);
  };

  const exportDailyLog = () => {
    // Build commission payment entries
    const commissionEntries = invoices.flatMap(inv => {
      const brokerName = brokers.find(b => b.id === inv.brokerId)?.name || 'Broker';
      return (inv.commissionPayments || []).map(cp => ({
        id: `COMM-${cp.id}`,
        date: cp.date,
        type: 'COMMISSION' as const,
        amount: cp.amount,
        isIncome: false,
        partyId: inv.brokerId,
        party: brokerName,
        description: `Commission for Inv #${inv.id} (${cp.method}${cp.bankName ? ' - ' + cp.bankName : ''})`
      }));
    });

    // Build same sortedItems used by the daily log (respecting range)
    const sortedItems = [...invoices.map((inv: any) => ({
        ...inv,
        type: 'SALES',
        amount: inv.total,
        isIncome: true,
        partyId: inv.customerId,
        party: (customers.find((c: any) => c.id === String(inv.customerId))?.name) || inv.customerId
      })),
      ...bills.map((bill: any) => ({
        ...bill,
        type: 'PURCHASE',
        amount: bill.total,
        isIncome: false,
        partyId: bill.vendorId,
        party: (vendors.find((v: any) => v.id === String(bill.vendorId))?.name) || bill.vendorId
      })),
      ...expenses.map((exp: Expense) => ({ ...exp, type: 'EXPENSE', amount: Number(exp.amount), isIncome: false, partyId: undefined, party: '' })),
      ...commissionEntries]
      .filter((it: any) => !!it.date && new Date(it.date) >= range.start && new Date(it.date) <= range.end)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const rows: any[] = sortedItems.map((item: any) => {
      runningBalance += item.isIncome ? item.amount : -item.amount;
      return {
        date: item.date,
        type: item.type,
        reference: item.type === 'EXPENSE' ? item.description : item.type === 'COMMISSION' ? item.description : item.id,
        party: item.party || '',
        cashIn: item.isIncome ? item.amount : 0,
        cashOut: !item.isIncome ? item.amount : 0,
        runningBalance
      };
    });

    const header = ['Date', 'Type', 'Reference', 'Party', 'Cash In', 'Cash Out', 'Running Balance'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const line = [r.date, r.type, String(r.reference), (r.party || ''), String(r.cashIn), String(r.cashOut), String(r.runningBalance)].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      lines.push(line);
    });

    downloadCsv(`cash-activity-${period}.csv`, lines.join('\n'));
  };

  return (
    <div className="space-y-6 bg-slate-100 p-4 rounded shadow-inner min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:scale-105">
           <div className="w-12 h-12 bg-green-50 text-green-600 flex items-center justify-center rounded-full">
              <i className="fas fa-arrow-up text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cash In (Sales)</p>
              <p className="text-xl font-bold text-slate-700">Rs. {totalSales.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:scale-105">
           <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-full">
              <i className="fas fa-arrow-down text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cash Out (Purchases + Expenses)</p>
              <p className="text-xl font-bold text-slate-700">Rs. {totalExpenses.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-md hover:scale-105">
           <div className="w-12 h-12 bg-amber-50 text-amber-600 flex items-center justify-center rounded-full">
              <i className="fas fa-user-tie text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Commission Paid</p>
              <p className="text-xl font-bold text-amber-700">Rs. {totalCommissionPaid.toLocaleString()}</p>
              {totalCommissionOutstanding > 0 && (
                <p className="text-[9px] font-bold text-red-500">Outstanding: Rs. {totalCommissionOutstanding.toLocaleString()}</p>
              )}
           </div>
        </div>
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-full">
              <i className="fas fa-wallet text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Net Profitability</p>
              <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                Rs. {netProfit.toLocaleString()}
              </p>
           </div>
        </div>
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4">
           <div className="w-12 h-12 bg-purple-50 text-purple-600 flex items-center justify-center rounded-full">
              <i className="fas fa-scale-balanced text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Liabilities</p>
              <p className="text-xl font-bold text-purple-700">
                Rs. {(totalExpenses + totalCommissionOutstanding).toLocaleString()}
              </p>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-3">
        <label className="text-sm text-slate-600 font-bold">Period:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="p-2 border rounded text-sm">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded border border-slate-300 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm font-bold text-slate-600">Cash Activity Log</h3>
           <div className="flex items-center space-x-3">
             <button onClick={exportDailyLog} className="text-[10px] font-bold text-blue-600 hover:underline">
               <i className="fas fa-file-export mr-1"></i> Export to Excel
             </button>
             <button className="text-[10px] font-bold text-slate-600" onClick={() => { setPeriod('daily'); }}>
               Show Today
             </button>
           </div>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2 font-bold text-slate-500">DATE</th>
              <th className="p-2 font-bold text-slate-500">TYPE</th>
              <th className="p-2 font-bold text-slate-500">REFERENCE</th>
              <th className="p-2 font-bold text-slate-500">PARTY</th>
              <th className="p-2 font-bold text-slate-500 text-right">CASH IN</th>
              <th className="p-2 font-bold text-slate-500 text-right">CASH OUT</th>
              <th className="p-2 font-bold text-slate-500 text-right">RUNNING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 && filteredBills.length === 0 && filteredExpenses.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-10 text-center text-slate-400 italic">No logs available</td>
               </tr>
            ) : (
              (() => {
                // Build commission payment entries from invoice commission payments
                const commissionEntries = filteredInvoices.flatMap(inv => {
                  const brokerName = brokers.find(b => b.id === inv.brokerId)?.name || 'Broker';
                  return (inv.commissionPayments || []).map(cp => ({
                    id: `COMM-${cp.id}`,
                    date: cp.date,
                    type: 'COMMISSION' as const,
                    amount: cp.amount,
                    isIncome: false,
                    partyId: inv.brokerId,
                    party: brokerName,
                    description: `Commission for Inv #${inv.id} (${cp.method}${cp.bankName ? ' - ' + cp.bankName : ''})`
                  }));
                }).filter(e => !!e.date && new Date(e.date) >= range.start && new Date(e.date) <= range.end);

                // Sort chronologically (oldest first) to calculate running balance
                const sortedItems = [...filteredInvoices.map((inv: any) => ({
                    ...inv,
                    type: 'SALES',
                    amount: inv.total,
                    isIncome: true,
                    partyId: inv.customerId,
                    party: (customers.find((c: any) => c.id === String(inv.customerId))?.name) || inv.customerId
                  })),
                  ...filteredBills.map((bill: any) => ({
                    ...bill,
                    type: 'PURCHASE',
                    amount: bill.total,
                    isIncome: false,
                    partyId: bill.vendorId,
                    party: (vendors.find((v: any) => v.id === String(bill.vendorId))?.name) || bill.vendorId
                  })),
                  ...filteredExpenses.map((exp: Expense) => ({ ...exp, type: 'EXPENSE', amount: Number(exp.amount), isIncome: false, partyId: undefined, party: '' })),
                  ...commissionEntries]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                let runningBalance = 0;
                
                // Calculate running balance and attach it to each item
                const itemsWithBalance = sortedItems.map((item: any) => {
                  runningBalance += item.isIncome ? item.amount : -item.amount;
                  return { ...item, runningBalance };
                });
                
                // Reverse to show newest first (latest on top)
                return itemsWithBalance.reverse().map((item: any, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-2">{item.date}</td>
                    <td className="p-2">
                      <span className={`font-bold ${item.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-2">{item.type === 'EXPENSE' ? item.description : item.type === 'COMMISSION' ? item.description : item.id}</td>
                    <td className="p-2">
                      {item.party ? (
                        onNavigate ? (
                          <button onClick={() => onNavigate(item.type === 'COMMISSION' ? 'brokers' : item.isIncome ? 'customers' : 'vendors', item.partyId)} className="text-blue-600 hover:underline font-bold">
                            {item.party}
                          </button>
                        ) : (
                          item.party
                        )
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="p-2 text-right text-green-600">{item.isIncome ? `+ ${item.amount.toLocaleString()}` : '-'}</td>
                    <td className="p-2 text-right text-red-600">{!item.isIncome ? `- ${item.amount.toLocaleString()}` : '-'}</td>
                    <td className={`p-2 text-right font-bold ${item.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Rs. {item.runningBalance.toLocaleString()}
                    </td>
                  </tr>
                ));
              })()
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded border border-slate-300 shadow-sm">
          <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-600">Balance Sheet (Receivables, Payables & Commissions)</h3>
          <div className="flex items-center space-x-4">
            <div className="text-[12px] font-black text-slate-700">
              <span className="mr-4">Receivables: Rs. {filteredInvoices.reduce((acc, i) => acc + Math.max(0, (i.total - (i.amountPaid || 0))), 0).toLocaleString()}</span>
              <span className="mr-4 text-red-700">Payables: Rs. {filteredBills.reduce((acc, b) => acc + Math.max(0, (b.total - (b.amountPaid || 0))), 0).toLocaleString()}</span>
              <span className="text-amber-700">Commission: Rs. {filteredInvoices.reduce((acc, inv) => acc + Math.max(0, (inv.commissionAmount || 0) - (inv.commissionPaid || 0)), 0).toLocaleString()}</span>
            </div>
            <button onClick={exportBalanceSheet} className="text-[12px] font-bold text-blue-600 hover:underline">
              <i className="fas fa-file-export mr-1"></i> Export to Excel
            </button>
          </div>
        </div>
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-2 font-bold text-slate-500">DATE</th>
              <th className="p-2 font-bold text-slate-500">TYPE</th>
              <th className="p-2 font-bold text-slate-500">REFERENCE</th>
              <th className="p-2 font-bold text-slate-500">PARTY</th>
              <th className="p-2 font-bold text-slate-500 text-right">AMOUNT</th>
              <th className="p-2 font-bold text-slate-500 text-right">RUNNING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Build combined items from outstanding receivables, payables, and commission payables
              const receivableItems = filteredInvoices
                .map(inv => ({
                  date: inv.date || '',
                  type: 'RECEIVABLE' as const,
                  reference: inv.id,
                  partyId: inv.customerId,
                  party: (customers.find(c => c.id === String(inv.customerId))?.name) || inv.customerId,
                  amount: Math.max(0, inv.total - (inv.amountPaid || 0)),
                  isIncome: true,
                  navigateTo: 'customers' as const
                }))
                .filter(i => i.amount > 0);

              const payableItems = filteredBills
                .map(bill => ({
                  date: bill.date || '',
                  type: 'PAYABLE' as const,
                  reference: bill.id,
                  partyId: bill.vendorId,
                  party: (vendors.find(v => v.id === String(bill.vendorId))?.name) || bill.vendorId,
                  amount: Math.max(0, bill.total - (bill.amountPaid || 0)),
                  isIncome: false,
                  navigateTo: 'vendors' as const
                }))
                .filter(b => b.amount > 0);

              const commissionItems = filteredInvoices
                .filter(inv => inv.brokerId && (inv.commissionAmount || 0) > (inv.commissionPaid || 0))
                .map(inv => ({
                  date: inv.date || '',
                  type: 'COMMISSION' as const,
                  reference: `Inv #${inv.id}`,
                  partyId: inv.brokerId || '',
                  party: brokers.find(b => b.id === inv.brokerId)?.name || 'Broker',
                  amount: Math.max(0, (inv.commissionAmount || 0) - (inv.commissionPaid || 0)),
                  isIncome: false,
                  navigateTo: 'brokers' as const
                }));

              const combined = [...receivableItems, ...payableItems, ...commissionItems]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              let running = 0;
              const withBalance = combined.map(it => {
                running += it.isIncome ? it.amount : -it.amount;
                return { ...it, runningBalance: running };
              });

              return withBalance.reverse().map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2"><span className={`font-black ${item.isIncome ? 'text-green-600' : item.type === 'COMMISSION' ? 'text-amber-600' : 'text-red-600'}`}>{item.type}</span></td>
                  <td className="p-2">{item.reference}</td>
                  <td className="p-2">
                    {onNavigate ? (
                      <button onClick={() => onNavigate(item.navigateTo, item.partyId)} className="text-blue-600 hover:underline font-bold">
                        {item.party}
                      </button>
                    ) : (
                      item.party
                    )}
                  </td>
                  <td className="p-2 text-right font-black">{item.isIncome ? `+ Rs. ${item.amount.toLocaleString()}` : `- Rs. ${item.amount.toLocaleString()}`}</td>
                  <td className={`p-2 text-right font-bold ${item.runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Rs. {item.runningBalance.toLocaleString()}</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsCenter;

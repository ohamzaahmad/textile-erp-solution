
import React from 'react';
import { Invoice, Bill, Expense, Vendor, Customer } from '../types';
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
  onNavigate?: (page: 'vendors' | 'customers', id?: string) => void;
}

const ReportsCenter: React.FC<ReportsCenterProps> = ({ invoices, bills, expenses, vendors, customers, onNavigate }) => {
  const totalSales = invoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalBillExpenses = bills.reduce((acc, curr) => acc + curr.total, 0);
  const totalOperationalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpenses = totalBillExpenses + totalOperationalExpenses;
  const netProfit = totalSales - totalExpenses;

  const data = [
    { name: 'Total Sales', amount: totalSales },
    { name: 'Total Expenses', amount: totalExpenses },
    { name: 'Net Profit', amount: netProfit },
  ];

  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6 bg-slate-100 p-4 rounded shadow-inner min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div className="bg-white p-6 rounded border border-slate-300 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm font-bold text-slate-600">Daily Cash Activity Log</h3>
           <button className="text-[10px] font-bold text-blue-600 hover:underline">
              <i className="fas fa-file-export mr-1"></i> Export to Excel
           </button>
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
            {invoices.length === 0 && bills.length === 0 && expenses.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-10 text-center text-slate-400 italic">No daily logs available</td>
               </tr>
            ) : (
              (() => {
                // Sort chronologically (oldest first) to calculate running balance
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
                  ...expenses.map((exp: Expense) => ({ ...exp, type: 'EXPENSE', amount: Number(exp.amount), isIncome: false, partyId: undefined, party: '' }))]
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
                    <td className="p-2">{item.type === 'EXPENSE' ? item.description : item.id}</td>
                    <td className="p-2">
                      {item.party ? (
                        onNavigate ? (
                          <button onClick={() => onNavigate(item.isIncome ? 'customers' : 'vendors', item.partyId)} className="text-blue-600 hover:underline font-bold">
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
          <h3 className="text-sm font-bold text-slate-600">Balance Sheet (Receivables & Payables)</h3>
          <div className="text-[12px] font-black text-slate-700">
            <span className="mr-4">Receivables: Rs. {invoices.reduce((acc, i) => acc + Math.max(0, (i.total - (i.amountPaid || 0))), 0).toLocaleString()}</span>
            <span className="text-red-700">Payables: Rs. {bills.reduce((acc, b) => acc + Math.max(0, (b.total - (b.amountPaid || 0))), 0).toLocaleString()}</span>
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
              // Build combined items from outstanding receivables and payables
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
                .filter(i => i.amount > 0);

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
                .filter(b => b.amount > 0);

              const combined = [...receivableItems, ...payableItems]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              let running = 0;
              const withBalance = combined.map(it => {
                running += it.isIncome ? it.amount : -it.amount;
                return { ...it, runningBalance: running };
              });

              return withBalance.reverse().map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2"><span className={`font-black ${item.isIncome ? 'text-green-600' : 'text-red-600'}`}>{item.type}</span></td>
                  <td className="p-2">{item.reference}</td>
                  <td className="p-2">
                    {onNavigate ? (
                      <button onClick={() => onNavigate(item.isIncome ? 'customers' : 'vendors', item.partyId)} className="text-blue-600 hover:underline font-bold">
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

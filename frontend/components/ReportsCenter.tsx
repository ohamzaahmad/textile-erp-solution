
import React from 'react';
import { Invoice, Bill } from '../types';
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
}

const ReportsCenter: React.FC<ReportsCenterProps> = ({ invoices, bills }) => {
  const totalSales = invoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = bills.reduce((acc, curr) => acc + curr.total, 0);
  const netProfit = totalSales - totalExpenses;

  const data = [
    { name: 'Total Sales', amount: totalSales },
    { name: 'Total Expenses', amount: totalExpenses },
    { name: 'Net Profit', amount: netProfit },
  ];

  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6 bg-slate-100 p-4 rounded shadow-inner min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4">
           <div className="w-12 h-12 bg-green-50 text-green-600 flex items-center justify-center rounded-full">
              <i className="fas fa-arrow-up text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cash In (Sales)</p>
              <p className="text-xl font-bold text-slate-700">Rs. {totalSales.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm flex items-center space-x-4">
           <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center rounded-full">
              <i className="fas fa-arrow-down text-xl"></i>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cash Out (Bills)</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-600 mb-6 flex items-center">
            <i className="fas fa-chart-bar mr-2 text-blue-500"></i>
            Revenue vs Expenses Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                   contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                   formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                   {data.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-slate-300 shadow-sm">
          <h3 className="text-sm font-bold text-slate-600 mb-6 flex items-center">
            <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
            Cash Flow Distribution
          </h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Sales', value: totalSales },
                    { name: 'Expenses', value: totalExpenses },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                   formatter={(value: any) => [`Rs. ${value.toLocaleString()}`, 'Total']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
              <th className="p-2 font-bold text-slate-500 text-right">CASH IN</th>
              <th className="p-2 font-bold text-slate-500 text-right">CASH OUT</th>
              <th className="p-2 font-bold text-slate-500 text-right">RUNNING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && bills.length === 0 ? (
               <tr>
                 <td colSpan={6} className="p-10 text-center text-slate-400 italic">No daily logs available</td>
               </tr>
            ) : (
              [...invoices, ...bills]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((item: any, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2">{item.date}</td>
                  <td className="p-2">
                    <span className={`font-bold ${item.customerId ? 'text-green-600' : 'text-red-600'}`}>
                      {item.customerId ? 'SALES' : 'BILL'}
                    </span>
                  </td>
                  <td className="p-2">{item.id}</td>
                  <td className="p-2 text-right text-green-600">{item.customerId ? `+ ${item.total.toLocaleString()}` : '-'}</td>
                  <td className="p-2 text-right text-red-600">{item.vendorId ? `- ${item.total.toLocaleString()}` : '-'}</td>
                  <td className="p-2 text-right font-bold">---</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsCenter;

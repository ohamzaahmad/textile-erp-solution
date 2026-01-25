
import React, { useState, useEffect } from 'react';
import { expensesAPI } from '../api';
import { Expense } from '../types';

interface ExpensesCenterProps {
  expenses: Expense[];
  onExpensesChange: (expenses: Expense[]) => void;
}

const ExpensesCenter: React.FC<ExpensesCenterProps> = ({ expenses: propExpenses, onExpensesChange }) => {
  const [expenses, setExpenses] = useState<Expense[]>(propExpenses);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [category, setCategory] = useState('Office Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('');

  const EXPENSE_CATEGORIES = [
    'Office Rent',
    'Employees Salary',
    'Builty (Transport)',
    'Packing',
    'Electricity Bill',
    'Gas Bill',
    'Water Bill',
    'Internet Bill',
    'Other Expenses'
  ];

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    setExpenses(propExpenses);
  }, [propExpenses]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await expensesAPI.getAll();
      setExpenses(data);
      onExpensesChange(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      alert('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!description || amount <= 0) {
      alert('Please enter description and valid amount');
      return;
    }

    try {
      const newExpense = {
        date: new Date().toISOString().slice(0, 10),
        category,
        description,
        amount,
        payment_method: paymentMethod,
        notes
      };

      await expensesAPI.create(newExpense);
      await loadExpenses();
      resetForm();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setCategory('Office Rent');
    setDescription('');
    setAmount(0);
    setPaymentMethod('Cash');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      try {
        await expensesAPI.delete(id);
        await loadExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  return (
    <div className="bg-white rounded border border-slate-300 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#7d2b3f] text-white flex items-center justify-center rounded-lg shadow-inner">
            <i className="fas fa-money-bill-wave text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#7d2b3f] tracking-tight">Expenses Management</h2>
            <p className="text-[10px] text-slate-500 uppercase font-black">Business Operational Costs</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#7d2b3f] text-white px-5 py-2 rounded text-xs font-black hover:bg-[#5a1f2d] transition-all shadow-lg flex items-center transform active:scale-95"
        >
          <i className="fas fa-plus-circle mr-2"></i> Add Expense
        </button>
      </div>

      {/* Add Expense Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-[#7d2b3f]">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-receipt text-[#7d2b3f]"></i>
                <span className="font-black text-sm text-slate-700 uppercase tracking-widest">Record Expense</span>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Expense Category</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded p-3 text-sm font-bold focus:ring-2 focus:ring-[#7d2b3f] outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded p-3 text-sm font-bold focus:ring-2 focus:ring-[#7d2b3f] outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Description</label>
                <input 
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., January 2026 Office Rent"
                  className="w-full border border-slate-300 rounded p-3 text-sm focus:ring-2 focus:ring-[#7d2b3f] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Amount (PKR)</label>
                <input 
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded p-3 text-lg font-black text-[#7d2b3f] focus:ring-2 focus:ring-[#7d2b3f] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full border border-slate-300 rounded p-3 text-sm focus:ring-2 focus:ring-[#7d2b3f] outline-none resize-none"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button 
                  onClick={resetForm}
                  className="px-6 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded border border-slate-300 uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddExpense}
                  className="px-8 py-2 text-xs font-black bg-[#7d2b3f] text-white rounded shadow-lg hover:bg-[#5a1f2d] uppercase tracking-widest transition-all active:scale-95"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="text-2xl font-black text-[#7d2b3f]">Rs. {totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Entries</p>
            <p className="text-2xl font-black text-slate-700">{expenses.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">This Month</p>
            <p className="text-2xl font-black text-green-600">
              Rs. {expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 overflow-auto bg-slate-50 custom-scrollbar">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="bg-[#7d2b3f] text-white sticky top-0 z-20 shadow-md">
            <tr>
              <th className="p-3 font-black uppercase tracking-widest">Date</th>
              <th className="p-3 font-black uppercase tracking-widest">Category</th>
              <th className="p-3 font-black uppercase tracking-widest">Description</th>
              <th className="p-3 text-right font-black uppercase tracking-widest">Amount</th>
              <th className="p-3 text-center font-black uppercase tracking-widest">Payment</th>
              <th className="p-3 text-center font-black uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {expenses.map(expense => (
              <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-[#7d2b3f]/10 text-[#7d2b3f] rounded text-[10px] font-black uppercase">
                    {expense.category}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-700">
                  {expense.description}
                  {expense.notes && <p className="text-[10px] text-slate-400 mt-1 italic">{expense.notes}</p>}
                </td>
                <td className="p-3 text-right font-black text-red-600">Rs. {Number(expense.amount || 0).toLocaleString()}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${
                    expense.payment_method === 'Cash' ? 'bg-green-100 text-green-700' : 
                    expense.payment_method === 'Bank' ? 'bg-blue-100 text-blue-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {expense.payment_method}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-32 text-center text-slate-400 italic">
                  <div className="flex flex-col items-center opacity-30">
                    <i className="fas fa-receipt text-6xl mb-4"></i>
                    <p className="text-xl font-light">No expenses recorded yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesCenter;

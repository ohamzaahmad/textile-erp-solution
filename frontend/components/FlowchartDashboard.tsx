
import React, { useState, useEffect } from 'react';
import { Page } from '../types';

interface FlowchartDashboardProps {
  onNavigate: (page: Page) => void;
  financialSummary?: {
    payables: number;
    receivables: number;
  };
}

const FlowchartDashboard: React.FC<FlowchartDashboardProps> = ({ onNavigate, financialSummary }) => {
  const FlowIcon = ({ icon, label, onClick, color = "maroon" }: { icon: string, label: string, onClick?: () => void, color?: string }) => {
    const colorClasses: Record<string, string> = {
      maroon: "text-red-600 bg-red-50 border-red-200 hover:border-red-400",
      green: "text-green-600 bg-green-50 border-green-200 hover:border-green-400",
      yellow: "text-yellow-600 bg-yellow-50 border-yellow-200 hover:border-yellow-400",
      purple: "text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-400",
    };

    return (
      <div 
        onClick={onClick}
        className="flex flex-col items-center cursor-pointer group transition-all duration-300 ease-in-out hover:scale-110"
      >
        <div className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 shadow-sm transition-all group-hover:shadow-md ${colorClasses[color]}`}>
          <i className={`fas ${icon} text-3xl`}></i>
        </div>
        <span className="mt-3 text-[11px] font-bold text-slate-600 text-center max-w-35 leading-tight group-hover:text-red-700 uppercase tracking-tighter">
          {label}
        </span>
      </div>
    );
  };

  const Arrow = ({ direction = "right", className = "" }: { direction?: "right" | "down" | "up" | "left", className?: string }) => {
    const icon = direction === "right" ? "fa-arrow-right" : direction === "down" ? "fa-arrow-down" : direction === "up" ? "fa-arrow-up" : "fa-arrow-left";
    return <i className={`fas ${icon} text-slate-300 text-lg ${className}`}></i>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-full">
      <div className="md:col-span-3 space-y-8">
        
        {/* Vendors Section */}
        <div className="bg-white rounded-xl border border-slate-300 p-8 relative shadow-sm">
          <div className="absolute -top-3 left-8 bg-[#7d2b3f] px-4 py-1 text-[10px] font-black text-white rounded-full uppercase shadow-md tracking-widest">Supplier Workflow</div>
          <div className="flex items-center justify-center gap-8">
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-dolly" label="Receive Inventory" color="green" onClick={() => onNavigate('inventory')} />
            </div>
            <div className="flex items-center justify-center text-slate-300">
              <Arrow />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-file-invoice" label="Enter Purchases" color="maroon" onClick={() => onNavigate('bills')} />
            </div>
            <div className="flex items-center justify-center text-slate-300">
              <Arrow />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-credit-card" label="Pay Bills" color="maroon" onClick={() => onNavigate('vendors')} />
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white rounded-xl border border-slate-300 p-8 relative shadow-sm">
          <div className="absolute -top-3 left-8 bg-[#7d2b3f] px-4 py-1 text-[10px] font-black text-white rounded-full uppercase shadow-md tracking-widest">Customer Workflow</div>
          <div className="flex items-center justify-center gap-8">
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-file-invoice-dollar" label="Create Sales" color="maroon" onClick={() => onNavigate('invoices')} />
            </div>
            <div className="flex items-center justify-center text-slate-300">
              <Arrow />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-hand-holding-dollar" label="Receive Payments" color="green" onClick={() => onNavigate('customers')} />
            </div>
            <div className="flex items-center justify-center text-slate-300">
              <Arrow />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-building-columns" label="Record Deposits" color="maroon" onClick={() => onNavigate('deposits')} />
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-xl border border-slate-300 p-8 relative shadow-sm">
          <div className="absolute -top-3 left-8 bg-[#5a6b85] px-4 py-1 text-[10px] font-black text-white rounded-full uppercase shadow-md tracking-widest">Inventory Management</div>
          <div className="flex items-center justify-center gap-8">
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-boxes-stacked" label="Inventory Center" color="maroon" onClick={() => onNavigate('inventory')} />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-chart-pie" label="Reports" color="maroon" onClick={() => onNavigate('reports')} />
            </div>
            <div className="w-36 shrink-0 flex justify-center">
              <FlowIcon icon="fa-calendar-check" label="Item Master" color="maroon" onClick={() => onNavigate('itemMaster')} />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column Summary */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-sm">
          <div className="bg-[#7d2b3f] px-4 py-3 text-white text-[11px] font-black flex justify-between items-center tracking-widest uppercase">
            <span>FINANCIAL SUMMARY</span>
          </div>
          <div className="p-5 space-y-4">
            {(() => {
              const payables = financialSummary?.payables ?? 0;
              const receivables = financialSummary?.receivables ?? 0;
              const net = receivables - payables;
              const fmt = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 });
              return (
                <>
                  <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold uppercase">Payables</span>
                    <span className="text-red-600 font-black">{fmt.format(payables)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold uppercase">Receivables</span>
                    <span className="text-green-600 font-black">{fmt.format(receivables)}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[12px] font-black bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-700 uppercase">Net Position</span>
                    <span className="text-[#7d2b3f]">{fmt.format(net)}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        
          <UserNoteCard />
      </div>
    </div>
  );
};

  const UserNoteCard: React.FC = () => {
    const STORAGE_KEY = 'ha_user_note_v1';
    const [note, setNote] = useState<string>('');
    const [saved, setSaved] = useState<boolean>(false);

    useEffect(() => {
      try {
        const v = localStorage.getItem(STORAGE_KEY) || '';
        setNote(v);
      } catch (e) {
        console.error('Failed to read saved note', e);
      }
    }, []);

    const handleSave = () => {
      try {
        const trimmed = note.trim();
        // Only one note allowed — save the entire text as the single note
        localStorage.setItem(STORAGE_KEY, trimmed);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        console.error('Failed to save note', e);
      }
    };

    const handleClear = () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        setNote('');
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      } catch (e) {
        console.error('Failed to clear note', e);
      }
    };

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-slate-700 text-[11px] uppercase tracking-widest flex items-center">
            <i className="fas fa-sticky-note mr-2 text-[#7d2b3f]"></i>
            Quick Note
          </h4>
          <div className="text-xs text-slate-400">Only one note saved</div>
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Write a short note to remember..."
          className="w-full min-h-24 border border-slate-100 rounded p-3 text-sm resize-y outline-none bg-slate-50"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button onClick={handleSave} className="px-4 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save</button>
            <button onClick={handleClear} className="px-3 py-2 text-xs font-bold border rounded text-slate-600">Clear</button>
          </div>
          <div className="text-xs text-slate-500">
            {saved ? <span className="text-green-600 font-black">Saved</span> : <span>Auto-saved to browser</span>}
          </div>
        </div>
      </div>
    );
  };

export default FlowchartDashboard;

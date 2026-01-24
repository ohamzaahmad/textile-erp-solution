
import React from 'react';
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
        <span className="mt-3 text-[11px] font-bold text-slate-600 text-center max-w-[90px] leading-tight group-hover:text-red-700 uppercase tracking-tighter">
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
          <div className="flex items-center justify-around">
            {/* Purchase Orders Removed as requested */}
            <FlowIcon icon="fa-dolly" label="Receive Inventory" color="green" onClick={() => onNavigate('inventory')} />
            <Arrow />
            <FlowIcon icon="fa-file-invoice" label="Enter Purchases" color="maroon" onClick={() => onNavigate('bills')} />
            <Arrow />
            <FlowIcon icon="fa-credit-card" label="Pay Bills" color="maroon" onClick={() => onNavigate('vendors')} />
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white rounded-xl border border-slate-300 p-8 relative shadow-sm">
          <div className="absolute -top-3 left-8 bg-[#7d2b3f] px-4 py-1 text-[10px] font-black text-white rounded-full uppercase shadow-md tracking-widest">Customer Workflow</div>
          <div className="flex flex-col space-y-8">
            <div className="flex items-center justify-around px-12">
               <FlowIcon icon="fa-file-invoice-dollar" label="Create Sales" color="maroon" onClick={() => onNavigate('invoices')} />
               <Arrow className="mx-8" />
               <FlowIcon icon="fa-hand-holding-dollar" label="Receive Payments" color="green" onClick={() => onNavigate('customers')} />
               <Arrow className="mx-8" />
               {/* Record Deposits now links to a specific view aggregation */}
               <FlowIcon icon="fa-building-columns" label="Record Deposits" color="maroon" onClick={() => onNavigate('deposits')} />
            </div>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-xl border border-slate-300 p-8 relative shadow-sm">
          <div className="absolute -top-3 left-8 bg-[#5a6b85] px-4 py-1 text-[10px] font-black text-white rounded-full uppercase shadow-md tracking-widest">Inventory Management</div>
          <div className="flex items-center justify-around">
            <FlowIcon icon="fa-boxes-stacked" label="Inventory Center" color="maroon" onClick={() => onNavigate('inventory')} />
            <FlowIcon icon="fa-chart-pie" label="Stock Reports" color="maroon" onClick={() => onNavigate('reports')} />
            {/* Item Master now links to a detailed fabric list */}
            <FlowIcon icon="fa-calendar-check" label="Item Master" color="maroon" onClick={() => onNavigate('itemMaster')} />
            {/* Adjust Quantity Removed as requested */}
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
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-[11px] shadow-sm">
          <h4 className="font-black text-red-800 mb-2 flex items-center uppercase tracking-tighter">
            <i className="fas fa-lightbulb mr-2 text-red-500"></i>
            Workflow Advice
          </h4>
          <p className="text-red-700 leading-relaxed font-medium">Use the <strong className="text-red-900">Create Sale</strong> screen to sell inventory. The system will track partial payments and update customer balances in real-time.</p>
        </div>
      </div>
    </div>
  );
};

export default FlowchartDashboard;

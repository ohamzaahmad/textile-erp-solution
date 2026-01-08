
import React from 'react';
import { Page, Role } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  role: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, role, onLogout }) => {
  const allMenuItems = [
    { id: 'home', label: 'Home', icon: 'fa-home', roles: ['manager'] },
    { id: 'vendors', label: 'Vendor Center', icon: 'fa-truck', roles: ['manager'] },
    { id: 'customers', label: 'Customer Center', icon: 'fa-users', roles: ['manager', 'cashier'] },
    { id: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked', roles: ['manager'] },
    { id: 'invoices', label: 'Invoices', icon: 'fa-file-invoice-dollar', roles: ['manager', 'cashier'] },
    { id: 'bills', label: 'Bills', icon: 'fa-receipt', roles: ['manager'] },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-line', roles: ['manager'] },
  ];

  const filteredItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-56 bg-[#2b5797] text-white flex flex-col h-full shadow-xl z-20">
      <div className="p-4 bg-[#1a3a6b] border-b border-[#0e2544]">
        <h1 className="text-lg font-bold flex items-center space-x-2">
          <i className="fas fa-tshirt"></i>
          <span>TextileFlow</span>
        </h1>
        <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">Enterprise Edition 2024</p>
      </div>

      <nav className="flex-1 overflow-y-auto mt-2">
        <div className="px-3 py-2 text-[10px] font-bold text-blue-200 uppercase opacity-50">Navigation Panel</div>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-200 ${
              currentPage === item.id 
                ? 'bg-white text-[#2b5797] font-semibold shadow-inner rounded-l-full ml-2' 
                : 'hover:bg-[#3d6db5] text-blue-50'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1a3a6b] space-y-4">
        <div className="text-[10px] text-blue-200">
          <p className="font-bold opacity-60 uppercase tracking-widest mb-1">Session Data</p>
          <p>Access: <span className="text-white">{role.toUpperCase()}</span></p>
          <p>Status: <span className="text-green-400 font-bold">Encrypted</span></p>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Terminate Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

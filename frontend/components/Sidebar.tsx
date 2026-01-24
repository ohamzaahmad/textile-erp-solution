
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
    { id: 'vendors', label: 'Supplier Center', icon: 'fa-truck', roles: ['manager'] },
    { id: 'customers', label: 'Customer Center', icon: 'fa-users', roles: ['manager', 'cashier'] },
    { id: 'inventory', label: 'Inventory', icon: 'fa-boxes-stacked', roles: ['manager'] },
    { id: 'invoices', label: 'Sales', icon: 'fa-file-invoice-dollar', roles: ['manager', 'cashier'] },
    { id: 'bills', label: 'Purchases', icon: 'fa-receipt', roles: ['manager'] },
    { id: 'expenses', label: 'Expenses', icon: 'fa-money-bill-wave', roles: ['manager'] },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-line', roles: ['manager'] },
  ];

  const filteredItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-56 bg-[#7d2b3f] text-white flex flex-col h-full shadow-xl z-20">
      <div className="p-4 bg-[#5a1f2d] border-b border-[#3d1420]">
        <h1 className="text-lg font-bold flex items-center space-x-2">
          <i className="fas fa-leaf"></i>
          <span>HA FABRICS</span>
        </h1>
        <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">Enterprise Edition 2024</p>
      </div>

      <nav className="flex-1 overflow-y-auto mt-2">
        <div className="px-3 py-2 text-[10px] font-bold text-red-200 uppercase opacity-50">Navigation Panel</div>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Page)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-all duration-300 ease-in-out transform ${
              currentPage === item.id 
                ? 'bg-white text-[#7d2b3f] font-semibold shadow-inner rounded-l-full ml-2 scale-105' 
                : 'hover:bg-[#9d3c52] text-red-50 hover:translate-x-1'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1a3a6b]">
        <button 
          onClick={onLogout}
          className="w-full bg-white text-[#2b5797] py-2 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all hover:opacity-90"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

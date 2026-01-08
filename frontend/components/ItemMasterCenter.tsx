
import React from 'react';
import { InventoryItem } from '../types';

interface ItemMasterCenterProps {
  inventory: InventoryItem[];
}

const ItemMasterCenter: React.FC<ItemMasterCenterProps> = ({ inventory }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-calendar-check text-xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Item Master</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fabric Inventory Registry</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#2b5797] text-white">
            <tr className="uppercase font-black text-[10px] tracking-widest">
              <th className="p-5">Lot Number</th>
              <th className="p-5">Fabric Name</th>
              <th className="p-5 text-right">Remaining Quantity (M)</th>
              <th className="p-5 text-right">Unit Price</th>
              <th className="p-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.length > 0 ? inventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5 font-black text-blue-700 font-mono">{item.lotNumber}</td>
                <td className="p-5 font-bold text-slate-700">{item.type}</td>
                <td className="p-5 text-right font-black text-slate-800 text-lg">
                  {item.meters.toLocaleString()}m
                </td>
                <td className="p-5 text-right font-bold text-slate-500">PKR {item.unitPrice.toLocaleString()}</td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.meters > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {item.meters > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-24 text-center text-slate-300 italic uppercase font-black tracking-[10px] opacity-20">No inventory records</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fabrics</p>
           <p className="text-3xl font-black text-slate-800">{inventory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Meters Available</p>
           <p className="text-3xl font-black text-blue-600">{inventory.reduce((acc, i) => acc + i.meters, 0).toLocaleString()}m</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inventory Valuation</p>
           <p className="text-3xl font-black text-green-600">PKR {inventory.reduce((acc, i) => acc + (i.meters * i.unitPrice), 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemMasterCenter;

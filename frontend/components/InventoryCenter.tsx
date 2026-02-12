
import React, { useState, useMemo, useEffect } from 'react';
import { itemMasterAPI, inventoryAPI, emitToast } from '../api';
import { InventoryItem, Vendor } from '../types';

interface InventoryCenterProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  vendors: Vendor[];
  onReceive: (items: InventoryItem[]) => void;
  onInitiateBill: (lotItems: InventoryItem[]) => void;
}

interface TempFabric {
  id: string;
  type: string;
  meters: number;
  unitPrice: number;
}

const InventoryCenter: React.FC<InventoryCenterProps> = ({ inventory, setInventory, vendors, onReceive, onInitiateBill }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  // Inline edit state for existing inventory items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ type: string; meters: number; unitPrice: number; lotNumber: string }>({ type: '', meters: 0, unitPrice: 0, lotNumber: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Receive Lot Form State
  const [lotNumber, setLotNumber] = useState('');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [fabrics, setFabrics] = useState<TempFabric[]>([]);
  
  // Current Fabric Input State
  const [fabricTypes, setFabricTypes] = useState<string[]>([]);
  const [fabricTypesLoading, setFabricTypesLoading] = useState(true);
  const [isManagingFabricTypes, setIsManagingFabricTypes] = useState(false);
  const [newFabricTypeName, setNewFabricTypeName] = useState('');
  const [currentFabric, setCurrentFabric] = useState<Omit<TempFabric, 'id'>>({
    type: '',
    meters: 0,
    unitPrice: 0
  });

  const loadFabricTypes = async () => {
    setFabricTypesLoading(true);
    try {
      const items = await itemMasterAPI.getAll();
      if (Array.isArray(items)) {
        const names = items.filter((it: any) => it.is_active).map((it: any) => it.name);
        setFabricTypes(names);
        if (names.length > 0 && !currentFabric.type) {
          setCurrentFabric(prev => ({ ...prev, type: names[0] }));
        }
      }
    } catch (e) {
      console.error('Failed to load fabric types:', e);
      alert('Failed to load fabric types. Please check your connection.');
    } finally {
      setFabricTypesLoading(false);
    }
  };

  useEffect(() => {
    loadFabricTypes();
  }, []);

  const handleAddFabricToLot = () => {
    if (currentFabric.meters <= 0 || currentFabric.unitPrice <= 0) {
      alert("Please enter valid fabric metrics");
      return;
    }
    const newFabric: TempFabric = {
      ...currentFabric,
      id: `tmp-${Date.now()}`
    };
    setFabrics([...fabrics, newFabric]);
    setCurrentFabric({ ...currentFabric, meters: 0, unitPrice: 0 });
  };

  const handleRemoveFabric = (id: string) => {
    setFabrics(fabrics.filter(f => f.id !== id));
  };

  const handleUpdateFabric = (id: string, field: keyof Omit<TempFabric, 'id'>, value: string | number) => {
    setFabrics(fabrics.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleFinalReceive = () => {
    if (!lotNumber || !vendorId || fabrics.length === 0) {
      alert("Please provide a Lot Number and at least one fabric item");
      return;
    }

    const newItems: InventoryItem[] = fabrics.map(f => ({
      id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      lotNumber,
      vendorId,
      type: f.type,
      meters: f.meters,
      unitPrice: f.unitPrice,
      receivedDate: new Date().toISOString().slice(0, 10),
      isBilled: false
    }));

    onReceive(newItems);
    setIsReceiving(false);
    resetForm();
  };

  const resetForm = () => {
    setLotNumber('');
    setFabrics([]);
    setCurrentFabric({ type: fabricTypes[0] || '', meters: 0, unitPrice: 0 });
  };

  const handleStartEdit = (item: InventoryItem) => {
    if (item.isBilled) {
      emitToast('Cannot edit billed items — they are linked to a purchase/bill.', 'error');
      return;
    }
    setEditingItemId(item.id);
    setEditValues({ type: item.type, meters: item.meters, unitPrice: item.unitPrice, lotNumber: item.lotNumber });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    if (editValues.meters <= 0 || editValues.unitPrice <= 0) {
      emitToast('Meters and unit price must be greater than 0', 'error');
      return;
    }
    if (!editValues.lotNumber.trim()) {
      emitToast('Lot number cannot be empty', 'error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const item = inventory.find(i => i.id === editingItemId);
      if (!item) return;
      await inventoryAPI.update(editingItemId, {
        lot_number: editValues.lotNumber.trim(),
        fabric_type: editValues.type,
        meters: editValues.meters,
        unit_price: editValues.unitPrice,
        vendor: parseInt(item.vendorId),
        received_date: item.receivedDate,
      });
      // Update local state
      setInventory(prev => prev.map(i => i.id === editingItemId ? {
        ...i,
        lotNumber: editValues.lotNumber.trim(),
        type: editValues.type,
        meters: editValues.meters,
        unitPrice: editValues.unitPrice,
      } : i));
      emitToast('Item updated successfully', 'success');
      setEditingItemId(null);
    } catch (e: any) {
      console.error('Failed to update inventory item:', e);
      emitToast('Failed to update item: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddFabricType = async () => {
    if (!newFabricTypeName.trim()) {
      alert('Please enter a fabric type name');
      return;
    }
    if (fabricTypes.includes(newFabricTypeName.trim())) {
      alert('This fabric type already exists');
      return;
    }
    try {
      const data = {
        code: `FAB-${Date.now()}`,
        name: newFabricTypeName.trim(),
        category: 'Fabric',
        unit_of_measure: 'Meters',
        is_active: true
      };
      await itemMasterAPI.create(data);
      setNewFabricTypeName('');
      await loadFabricTypes();
      alert('Fabric type added successfully!');
    } catch (e) {
      console.error('Failed to add fabric type:', e);
      alert('Failed to add fabric type. Please try again.');
    }
  };

  const handleDeleteFabricType = async (fabricName: string) => {
    if (!confirm(`Are you sure you want to delete "${fabricName}"? This cannot be undone.`)) {
      return;
    }
    try {
      const items = await itemMasterAPI.getAll();
      const itemToDelete = items.find((it: any) => it.name === fabricName);
      if (itemToDelete) {
        await itemMasterAPI.delete(itemToDelete.id);
        await loadFabricTypes();
        alert('Fabric type deleted successfully!');
      }
    } catch (e) {
      console.error('Failed to delete fabric type:', e);
      alert('Failed to delete fabric type. Please try again.');
    }
  };

  const groupedInventory = useMemo(() => {
    const filtered = inventory.filter(item => 
      item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, InventoryItem[]> = {};
    filtered.forEach(item => {
      if (!groups[item.lotNumber]) groups[item.lotNumber] = [];
      groups[item.lotNumber].push(item);
    });

    return groups;
  }, [inventory, searchTerm]);

  return (
    <div className="bg-white rounded border border-slate-300 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#7d2b3f] text-white flex items-center justify-center rounded-lg shadow-inner">
            <i className="fas fa-boxes-stacked text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#7d2b3f] tracking-tight">Stock Management</h2>
            <p className="text-[10px] text-slate-500 uppercase font-black">Multi-Fabric Lot Tracking System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
             <input 
                type="text" 
                placeholder="Find lot or fabric..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs p-2 pl-9 border border-slate-300 rounded outline-none w-64 shadow-inner focus:border-red-500 transition-all"
             />
             <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-xs transition-colors group-focus-within:text-blue-500"></i>
          </div>
          <button 
            onClick={() => setIsManagingFabricTypes(true)}
            className="bg-[#7d2b3f] text-white px-4 py-2 rounded text-xs font-black hover:bg-[#5a1f2d] transition-all shadow-lg flex items-center"
            title="Manage Fabric Types"
          >
            <i className="fas fa-tags mr-2"></i> Fabric Types
          </button>
          <button 
            onClick={() => setIsReceiving(true)}
            className="bg-green-600 text-white px-5 py-2 rounded text-xs font-black hover:bg-green-700 transition-all shadow-lg flex items-center transform active:scale-95"
          >
            <i className="fas fa-plus-circle mr-2"></i> Receive Lot
          </button>
        </div>
      </div>

      {/* Fabric Type Management Modal */}
      {isManagingFabricTypes && (
        <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-[#7d2b3f]">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-tags text-[#7d2b3f]"></i>
                <span className="font-black text-sm text-slate-700 uppercase tracking-widest">Manage Fabric Types</span>
              </div>
              <button onClick={() => setIsManagingFabricTypes(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add New Fabric Type */}
              <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                <label className="block text-[10px] font-black text-green-700 uppercase mb-2">
                  <i className="fas fa-plus-circle mr-1"></i> Add New Fabric Type
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newFabricTypeName}
                    onChange={e => setNewFabricTypeName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddFabricType()}
                    className="flex-1 border border-green-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g., Cotton Twill, Silk Blend, etc."
                  />
                  <button 
                    onClick={handleAddFabricType}
                    className="bg-green-600 text-white px-6 py-2 rounded text-xs font-black hover:bg-green-700 transition-all shadow-lg"
                  >
                    <i className="fas fa-plus mr-1"></i> Add
                  </button>
                </div>
              </div>

              {/* Existing Fabric Types List */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">
                  <i className="fas fa-list mr-1"></i> Current Fabric Types ({fabricTypes.length})
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  {fabricTypesLoading ? (
                    <div className="p-8 text-center text-slate-400">
                      <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                      <p className="text-xs">Loading fabric types...</p>
                    </div>
                  ) : fabricTypes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <i className="fas fa-inbox text-3xl mb-2"></i>
                      <p className="text-xs italic">No fabric types defined yet. Add one above to get started.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 sticky top-0">
                        <tr>
                          <th className="p-3 font-black uppercase">#</th>
                          <th className="p-3 font-black uppercase">Fabric Type Name</th>
                          <th className="p-3 text-center font-black uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fabricTypes.map((type, index) => (
                          <tr key={type} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                            <td className="p-3 font-bold text-slate-700">{type}</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleDeleteFabricType(type)}
                                className="text-red-400 hover:text-red-600 transition-colors px-3 py-1 rounded hover:bg-red-50"
                                title="Delete this fabric type"
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>Note:</strong> Fabric types are used throughout the system when receiving inventory and creating invoices/bills.
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-200">
                <button 
                  onClick={() => setIsManagingFabricTypes(false)}
                  className="px-8 py-2 text-xs font-black bg-slate-600 text-white rounded hover:bg-slate-700 transition-all uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Multi-Fabric Lot Modal */}
      {isReceiving && (
        <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-[#7d2b3f]">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <i className="fas fa-truck-loading text-[#7d2b3f]"></i>
                <span className="font-black text-sm text-slate-700 uppercase tracking-widest">Receive Inventory Lot</span>
              </div>
              <button onClick={() => setIsReceiving(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lot Header Info */}
              <div className="grid grid-cols-2 gap-6 bg-[#7d2b3f]/5 p-4 rounded-lg border border-[#7d2b3f]/20">
                <div>
                  <label className="block text-[10px] font-black text-[#7d2b3f] uppercase mb-1">Lot Number / Batch ID</label>
                  <input 
                    type="text" 
                    value={lotNumber}
                    onChange={e => setLotNumber(e.target.value)}
                    className="w-full border border-[#7d2b3f]/30 rounded p-2 text-sm focus:ring-2 focus:ring-[#7d2b3f] outline-none font-bold transition-all duration-200" 
                    placeholder="e.g. LOT-X99"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#7d2b3f] uppercase mb-1">Origin Supplier</label>
                  <select 
                    value={vendorId}
                    onChange={e => setVendorId(e.target.value)}
                    className="w-full border border-[#7d2b3f]/30 rounded p-2 text-sm focus:ring-2 focus:ring-[#7d2b3f] font-bold"
                  >
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Add Fabric Sub-form */}
              <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fabric Category</label>
                    <select 
                      value={currentFabric.type}
                      onChange={e => setCurrentFabric({...currentFabric, type: e.target.value})}
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                      disabled={fabricTypesLoading || fabricTypes.length === 0}
                    >
                      {fabricTypesLoading ? (
                        <option>Loading...</option>
                      ) : fabricTypes.length === 0 ? (
                        <option>No fabric types available - Please add one first</option>
                      ) : (
                        fabricTypes.map(t => <option key={t} value={t}>{t}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity (Meters)</label>
                    <input 
                      type="number" 
                      value={currentFabric.meters}
                      onChange={e => setCurrentFabric({...currentFabric, meters: parseFloat(e.target.value) || 0})}
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit Cost (PKR)</label>
                      <input 
                        type="number" 
                        value={currentFabric.unitPrice}
                        onChange={e => setCurrentFabric({...currentFabric, unitPrice: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-300 rounded p-2 text-xs"
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      onClick={handleAddFabricToLot}
                      className="bg-[#7d2b3f] text-white p-2 rounded hover:bg-[#5a1f2d] h-8.5 transition-colors"
                      title="Add to List"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview List */}
              <div className="border border-slate-200 rounded overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-2 font-black">FABRIC TYPE</th>
                      <th className="p-2 text-right font-black">METERS</th>
                      <th className="p-2 text-right font-black">UNIT COST</th>
                      <th className="p-2 text-right font-black">TOTAL</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fabrics.length > 0 ? fabrics.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-2">
                          <select
                            value={f.type}
                            onChange={e => handleUpdateFabric(f.id, 'type', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1 text-xs font-bold bg-white focus:ring-1 focus:ring-[#7d2b3f] outline-none"
                          >
                            {fabricTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={f.meters}
                            onChange={e => handleUpdateFabric(f.id, 'meters', parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded p-1 text-xs text-right font-bold bg-white focus:ring-1 focus:ring-[#7d2b3f] outline-none"
                            min="0.01"
                            step="0.01"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={f.unitPrice}
                            onChange={e => handleUpdateFabric(f.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border border-slate-200 rounded p-1 text-xs text-right font-bold bg-white focus:ring-1 focus:ring-[#7d2b3f] outline-none"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="p-2 text-right font-black text-[#7d2b3f]">Rs. {(f.meters * f.unitPrice).toLocaleString()}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => handleRemoveFabric(f.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No fabrics added to this lot yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-200">
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Lot Cost</p>
                   <p className="text-xl font-black text-green-700">Rs. {fabrics.reduce((acc, f) => acc + (f.meters * f.unitPrice), 0).toLocaleString()}</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setIsReceiving(false)} className="px-6 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded border border-slate-300 uppercase tracking-widest">Cancel</button>
                  <button 
                    onClick={handleFinalReceive} 
                    disabled={fabrics.length === 0}
                    className={`px-8 py-2 text-xs font-black rounded shadow-lg uppercase tracking-widest transition-all ${fabrics.length > 0 ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    Receive Stock Lot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Table Display */}
      <div className="flex-1 overflow-auto bg-slate-50 custom-scrollbar">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="bg-[#7d2b3f] text-white sticky top-0 z-20 shadow-md">
            <tr>
              <th className="p-3 w-48 font-black uppercase tracking-widest">Lot Info</th>
              <th className="p-3 font-black uppercase tracking-widest">Fabric Description</th>
              <th className="p-3 text-right font-black uppercase tracking-widest">Qty (Meters)</th>
              <th className="p-3 text-center font-black uppercase tracking-widest">Financial Status</th>
              <th className="p-3 text-right font-black uppercase tracking-widest">Lot Value</th>
              <th className="p-3 text-center font-black uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {/* FIX: Explicitly type the result of Object.entries(groupedInventory) to ensure 'items' is treated as InventoryItem[] and not unknown */}
            {(Object.entries(groupedInventory) as [string, InventoryItem[]][]).map(([lotNum, items]) => {
              const vendor = vendors.find(v => v.id === items[0].vendorId);
              const totalMeters = items.reduce((acc, curr) => acc + curr.meters, 0);
              const totalValue = items.reduce((acc, curr) => acc + (curr.meters * curr.unitPrice), 0);
              
              return (
                <React.Fragment key={lotNum}>
                  {/* Lot Header Row */}
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <td className="p-3 font-black text-[#7d2b3f] text-sm flex items-center space-x-2">
                       <i className="fas fa-layer-group text-slate-400"></i>
                       <span>{lotNum}</span>
                    </td>
                    <td className="p-3 italic text-slate-500">
                       {vendor?.name} • {items[0].receivedDate} • {items.length} fabric{items.length > 1 ? 's' : ''}
                    </td>
                    <td className="p-3 text-right font-black text-slate-700">
                       {totalMeters.toFixed(2)}m
                    </td>
                    <td className="p-3 text-center">
                       {items.every(it => it.isBilled) ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight text-green-700 bg-green-100">
                            <i className="fas fa-check-circle mr-1"></i> Billed
                          </span>
                       ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight text-orange-700 bg-orange-100">
                            <i className="fas fa-clock mr-1"></i> Unbilled
                          </span>
                       )}
                    </td>
                    <td className="p-3 text-right font-black text-slate-800">
                       Rs. {totalValue.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                       {!items.every(it => it.isBilled) ? (
                          <button 
                            onClick={() => onInitiateBill(items)}
                            className="bg-[#7d2b3f] text-white px-4 py-2 rounded text-[10px] font-black hover:bg-[#5a1f2d] transition-all shadow-md uppercase tracking-wide"
                          >
                            <i className="fas fa-file-invoice mr-2"></i> Create Purchase
                          </button>
                       ) : (
                          <span className="text-[10px] text-green-600 font-bold">
                            <i className="fas fa-check-double mr-1"></i> Completed
                          </span>
                       )}
                    </td>
                  </tr>
                  {/* Fabric Item Sub-rows */}
                  {items.map(item => {
                    const isEditing = editingItemId === item.id;
                    return (
                    <tr key={item.id} className={`border-b border-slate-100 transition-colors ${isEditing ? 'bg-yellow-50 ring-1 ring-yellow-300' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3 pl-10 text-slate-400 italic border-l-4 border-slate-200 text-[10px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.lotNumber}
                            onChange={e => setEditValues({ ...editValues, lotNumber: e.target.value })}
                            className="w-full border border-yellow-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 bg-white outline-none focus:ring-1 focus:ring-[#7d2b3f]"
                            placeholder="Lot#"
                          />
                        ) : (
                          <>#{item.id.slice(-4)}</>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-700">
                        {isEditing ? (
                          <select
                            value={editValues.type}
                            onChange={e => setEditValues({ ...editValues, type: e.target.value })}
                            className="w-full border border-yellow-300 rounded px-1.5 py-0.5 text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-[#7d2b3f]"
                          >
                            {fabricTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          item.type
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.meters}
                            onChange={e => setEditValues({ ...editValues, meters: parseFloat(e.target.value) || 0 })}
                            className="w-24 border border-yellow-300 rounded px-1.5 py-0.5 text-xs text-right font-bold bg-white outline-none focus:ring-1 focus:ring-[#7d2b3f]"
                            min="0.01"
                            step="0.01"
                          />
                        ) : (
                          <>{item.meters.toFixed(2)}m</>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter ${item.isBilled ? 'text-green-700 bg-green-100' : 'text-slate-500 bg-slate-100'}`}>
                          {item.isBilled ? 'Included' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-500 text-[11px] font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.unitPrice}
                            onChange={e => setEditValues({ ...editValues, unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-24 border border-yellow-300 rounded px-1.5 py-0.5 text-xs text-right font-bold bg-white outline-none focus:ring-1 focus:ring-[#7d2b3f]"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <>@ Rs. {item.unitPrice.toLocaleString()} /m</>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              disabled={isSavingEdit}
                              className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-black hover:bg-green-700 transition-all disabled:opacity-50"
                              title="Save"
                            >
                              {isSavingEdit ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-slate-400 text-white px-2 py-1 rounded text-[9px] font-black hover:bg-slate-500 transition-all"
                              title="Cancel"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className={`text-[10px] font-bold transition-colors ${item.isBilled ? 'text-slate-300 cursor-not-allowed' : 'text-blue-400 hover:text-blue-600'}`}
                            title={item.isBilled ? 'Cannot edit billed items' : 'Edit this item'}
                          >
                            <i className="fas fa-pen mr-1"></i>{item.isBilled ? 'Locked' : 'Edit'}
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {Object.keys(groupedInventory).length === 0 && (
              <tr>
                <td colSpan={6} className="p-32 text-center text-slate-400 italic">
                  <div className="flex flex-col items-center opacity-30">
                    <i className="fas fa-search-minus text-6xl mb-4"></i>
                    <p className="text-xl font-light">No stock records matching your criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Stats */}
      <div className="p-4 bg-slate-100 border-t border-slate-300 flex justify-between items-center text-[11px]">
        <div className="flex space-x-8">
          <div className="flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[9px]">Active Lots</span>
            <span className="font-black text-slate-700 text-lg leading-tight">{Object.keys(groupedInventory).length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-bold uppercase text-[9px]">Total Stock Value</span>
            <span className="font-black text-blue-700 text-lg leading-tight">Rs. {inventory.reduce((acc, curr) => acc + (curr.meters * curr.unitPrice), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-black border border-orange-200">
              <i className="fas fa-clock animate-pulse"></i>
              <span className="uppercase tracking-tighter">Unbilled Value: Rs. {inventory.filter(i => !i.isBilled).reduce((acc, curr) => acc + (curr.meters * curr.unitPrice), 0).toLocaleString()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryCenter;

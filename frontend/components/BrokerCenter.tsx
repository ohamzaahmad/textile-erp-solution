import React, { useMemo, useState } from 'react';
import { Broker } from '../types';

interface BrokerCenterProps {
  brokers: Broker[];
  onAddBroker: (broker: Broker) => Promise<Broker | null>;
  onUpdateBroker: (broker: Broker) => Promise<Broker | null>;
  onDeleteBroker: (brokerId: string) => Promise<boolean>;
}

const BrokerCenter: React.FC<BrokerCenterProps> = ({ brokers, onAddBroker, onUpdateBroker, onDeleteBroker }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(brokers[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newBroker, setNewBroker] = useState<Broker>({ id: '', name: '', contact: '', address: '' });
  const [editBroker, setEditBroker] = useState<Broker | null>(null);

  const filteredBrokers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return brokers;
    return brokers.filter(b =>
      (b.name || '').toLowerCase().includes(term) ||
      (b.contact || '').toLowerCase().includes(term)
    );
  }, [brokers, searchTerm]);

  const selectedBroker = brokers.find(b => b.id === selectedBrokerId) || null;

  const handleCreate = async () => {
    if (!newBroker.name.trim()) {
      alert('Broker name is required');
      return;
    }

    const created = await onAddBroker({
      id: '',
      name: newBroker.name.trim(),
      contact: (newBroker.contact || '').trim(),
      address: (newBroker.address || '').trim(),
    });

    if (created) {
      setSelectedBrokerId(created.id);
      setNewBroker({ id: '', name: '', contact: '', address: '' });
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editBroker || !editBroker.name.trim()) {
      alert('Broker name is required');
      return;
    }

    const updated = await onUpdateBroker({
      id: editBroker.id,
      name: editBroker.name.trim(),
      contact: (editBroker.contact || '').trim(),
      address: (editBroker.address || '').trim(),
    });

    if (updated) {
      setSelectedBrokerId(updated.id);
      setIsEditing(false);
      setEditBroker(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBroker) return;
    if (!window.confirm(`Delete broker "${selectedBroker.name}"?`)) return;

    const ok = await onDeleteBroker(selectedBroker.id);
    if (ok) {
      const next = brokers.filter(b => b.id !== selectedBroker.id);
      setSelectedBrokerId(next[0]?.id || null);
    }
  };

  return (
    <div className="flex h-full bg-[#f0f3f6] rounded border border-[#a3b6cc] overflow-hidden shadow-2xl">
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Add New Broker</span>
              <button onClick={() => setIsCreating(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={newBroker.name} onChange={e => setNewBroker({ ...newBroker, name: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Broker Name" />
              <input type="text" value={newBroker.contact || ''} onChange={e => setNewBroker({ ...newBroker, contact: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Contact (optional)" />
              <input type="text" value={newBroker.address || ''} onChange={e => setNewBroker({ ...newBroker, address: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Address (optional)" />
              <div className="pt-4 flex justify-end space-x-2 border-t">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleCreate} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && editBroker && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#7d2b3f] p-3 text-white font-bold text-sm flex justify-between items-center">
              <span>Edit Broker</span>
              <button onClick={() => { setIsEditing(false); setEditBroker(null); }}><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={editBroker.name} onChange={e => setEditBroker({ ...editBroker, name: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Broker Name" />
              <input type="text" value={editBroker.contact || ''} onChange={e => setEditBroker({ ...editBroker, contact: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Contact (optional)" />
              <input type="text" value={editBroker.address || ''} onChange={e => setEditBroker({ ...editBroker, address: e.target.value })} className="w-full border p-2 text-sm outline-none" placeholder="Address (optional)" />
              <div className="pt-4 flex justify-end space-x-2 border-t">
                <button onClick={() => { setIsEditing(false); setEditBroker(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded">Cancel</button>
                <button onClick={handleSaveEdit} className="px-6 py-2 text-xs font-bold bg-[#7d2b3f] text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-70 bg-white border-r border-[#a3b6cc] flex flex-col shrink-0">
        <div className="p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase whitespace-nowrap">Brokers</span>
            <button onClick={() => setIsCreating(true)} className="text-[10px] font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm whitespace-nowrap">New Broker</button>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-xs p-2 pl-9 border border-[#7d2b3f]/60 rounded-sm outline-none shadow-inner" />
            <i className="fas fa-search absolute left-3 top-2.5 text-slate-400 text-[10px]"></i>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredBrokers.map(b => (
            <div key={b.id} onClick={() => setSelectedBrokerId(b.id)} className={`p-3 border-b border-[#e1e8ef] cursor-pointer transition-all ${selectedBrokerId === b.id ? 'bg-[#7d2b3f] text-white shadow-md' : 'hover:bg-slate-50'}`}>
              <div className="text-[12px] font-bold truncate">{b.name}</div>
              <div className={`text-[10px] ${selectedBrokerId === b.id ? 'text-red-100' : 'text-slate-400'}`}>{b.contact || 'No contact'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedBroker ? (
          <>
            <div className="p-10 border-b border-[#e1e8ef] bg-white flex justify-between items-start">
              <div className="space-y-3">
                <h2 className="text-4xl font-light text-slate-400 tracking-tight">Broker Information</h2>
                <div className="pt-2 space-y-2">
                  <p className="text-xl font-bold text-slate-800 uppercase tracking-tighter">{selectedBroker.name}</p>
                  <p className="text-sm text-slate-600 font-medium flex items-center">
                    <i className="fas fa-phone mr-2 text-slate-400"></i> {selectedBroker.contact || 'No contact provided'}
                  </p>
                  <p className="text-sm text-slate-600 font-medium flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-slate-400"></i> {selectedBroker.address || 'No address provided'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-[#e1e8ef] bg-white text-right space-x-2">
              <button
                onClick={() => {
                  setEditBroker({ ...selectedBroker });
                  setIsEditing(true);
                }}
                className="px-4 py-1 text-xs font-bold bg-[#7d2b3f] text-white rounded"
              >
                Edit Broker
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1 text-xs font-bold bg-red-600 text-white rounded"
              >
                Delete Broker
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No broker selected</div>
        )}
      </div>
    </div>
  );
};

export default BrokerCenter;

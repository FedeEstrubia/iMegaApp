
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { DeviceCondition, Product } from '../types';

const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  // Fix: isAdmin does not exist on AppContextType, use userRole to derive isAdmin state.
  const { 
    userRole, inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    businessLiquidity, setBusinessLiquidity 
  } = useAppContext();
  
  // Local variable to check if the user has the admin role.
  const isAdmin = userRole === 'admin';
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [liqInput, setLiqInput] = useState(businessLiquidity.toString());

  // Form State
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    storage: '128GB',
    price: 0,
    costPrice: 0,
    batteryHealth: '100%',
    condition: DeviceCondition.NEW,
    color: 'Negro',
    description: '',
    imageUrl: '',
    thumbnails: []
  });

  const resetForm = () => {
    setForm({
      name: '',
      storage: '128GB',
      price: 0,
      costPrice: 0,
      batteryHealth: '100%',
      condition: DeviceCondition.NEW,
      color: 'Negro',
      description: '',
      imageUrl: '',
      thumbnails: []
    });
    setEditingId(null);
    setImageUrlInput('');
    setConfirmDeleteId(null);
  };

  const handleOpenEdit = (product: Product) => {
    setForm(product);
    setEditingId(product.id);
    setShowModal(true);
  };

  const execDelete = (id: string) => {
    deleteInventoryItem(id);
    setConfirmDeleteId(null);
    if (editingId === id) {
      setShowModal(false);
      resetForm();
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (!form.imageUrl) {
      setForm({ ...form, imageUrl: imageUrlInput });
    } else {
      setForm({ ...form, thumbnails: [...(form.thumbnails || []), imageUrlInput] });
    }
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number, isMain: boolean) => {
    if (isMain) {
      const nextThumb = form.thumbnails?.[0];
      const remainingThumbs = form.thumbnails?.slice(1) || [];
      setForm({ ...form, imageUrl: nextThumb || '', thumbnails: remainingThumbs });
    } else {
      const newThumbs = form.thumbnails?.filter((_, i) => i !== index) || [];
      setForm({ ...form, thumbnails: newThumbs });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      ...form as Product,
      id: editingId || `custom-${Date.now()}`,
      thumbnails: form.thumbnails || [],
      specs: [
        { label: 'Salud Batería', value: form.batteryHealth || '100%', icon: 'battery_full' },
        { label: 'Estado', value: form.condition || 'Nuevo', icon: 'stars' },
        { label: 'Color', value: form.color || 'N/A', icon: 'palette' },
      ]
    };
    if (editingId) {
      updateInventoryItem(productData);
    } else {
      addInventoryItem(productData);
    }
    setShowModal(false);
    resetForm();
  };

  const handleUpdateLiquidity = () => {
    const val = parseFloat(liqInput);
    if (!isNaN(val)) setBusinessLiquidity(val);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">lock</span>
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-slate-500 mb-6">No tienes permisos para ver esta sección.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Volver al Inicio</button>
      </div>
    );
  }

  const totalCost = inventory.reduce((acc, p) => acc + (p.costPrice || 0), 0);
  const totalPotentialSales = inventory.reduce((acc, p) => acc + p.price, 0);
  const totalPotentialGain = totalPotentialSales - totalCost;

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Panel de Gestión</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Modo Administrador</p>
          </div>
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar pb-24">
        
        {/* Gestión de Liquidez */}
        <div className="p-5 bg-surface-darker text-white rounded-3xl space-y-4">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Liquidez del Negocio</p>
                 <p className="text-3xl font-black text-emerald-400">${businessLiquidity.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-500/20 p-2 rounded-xl">
                 <span className="material-symbols-outlined text-emerald-400">account_balance_wallet</span>
              </div>
           </div>
           <div className="flex gap-2">
              <input 
                type="number" 
                value={liqInput} 
                onChange={e => setLiqInput(e.target.value)}
                className="flex-1 bg-white/10 border-0 rounded-xl px-3 py-2 text-sm font-bold"
              />
              <button 
                onClick={handleUpdateLiquidity}
                className="bg-primary px-4 rounded-xl text-xs font-bold"
              >
                Ajustar
              </button>
           </div>
           <p className="text-[10px] text-slate-500 italic">* Esta liquidez limita las operaciones de downgrade con efectivo.</p>
        </div>

        {/* Metricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
             <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined">trending_up</span></div>
             <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ganancia Total Potencial</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${totalPotentialGain.toLocaleString()}</p>
             </div>
          </div>
          <div className="p-3 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Inversión Stock</p>
             <p className="text-lg font-bold text-orange-500">${totalCost.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Dispositivos</p>
             <p className="text-lg font-bold text-blue-500">{inventory.length}</p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Añadir Nuevo iPhone</span>
        </button>

        {/* Inventario Detallado */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 pl-1 tracking-widest">Inventario en Tiempo Real</h3>
          <div className="space-y-3">
            {inventory.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800"><p className="text-slate-400 text-sm font-medium">No hay productos en el inventario</p></div>
            ) : inventory.map(p => {
              const gain = p.price - (p.costPrice || 0);
              const isConfirming = confirmDeleteId === p.id;
              return (
                <div key={p.id} className="relative flex flex-col p-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary/50 transition-colors overflow-hidden">
                  {isConfirming && (
                    <div className="absolute inset-0 z-10 bg-red-600/95 dark:bg-red-900/95 flex flex-col items-center justify-center p-4 text-white animate-in fade-in duration-200">
                      <p className="text-sm font-bold mb-3">¿Eliminar este iPhone?</p>
                      <div className="flex gap-4 w-full">
                        <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-lg bg-white/20 hover:bg-white/30 font-bold text-xs">Cancelar</button>
                        <button onClick={() => execDelete(p.id)} className="flex-1 py-2 rounded-lg bg-white text-red-600 font-bold text-xs">Confirmar</button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 relative">
                        <img src={p.imageUrl || 'https://via.placeholder.com/150?text=iPhone'} alt={p.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">{p.storage}</span>
                           <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold">{p.batteryHealth}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(p)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button onClick={() => setConfirmDeleteId(p.id)} className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center"><p className="text-[8px] uppercase text-slate-400 font-black mb-1">Costo</p><p className="text-sm font-bold text-slate-600 dark:text-slate-300">${p.costPrice}</p></div>
                    <div className="bg-primary/5 p-2 rounded-xl text-center"><p className="text-[8px] uppercase text-primary font-black mb-1">P. Venta</p><p className="text-sm font-bold text-primary">${p.price}</p></div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl text-center"><p className="text-[8px] uppercase text-emerald-500 font-black mb-1">Ganancia</p><p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+${gain}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-background-light dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
              <h2 className="text-xl font-bold">{editingId ? 'Editar iPhone' : 'Nuevo iPhone'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar pb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de Fotos</label>
                <div className="flex gap-2">
                  <input type="text" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="Pegar URL de imagen..." className="flex-1 bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm" />
                  <button type="button" onClick={handleAddImageUrl} className="bg-primary text-white w-12 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">add</span></button>
                </div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Modelo</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: iPhone 15 Pro Max" className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-bold" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacenamiento</label><select value={form.storage} onChange={e => setForm({...form, storage: e.target.value})} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-medium"><option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salud Batería</label><input required type="text" value={form.batteryHealth} onChange={e => setForm({...form, batteryHealth: e.target.value})} placeholder="Ej: 100%" className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-medium" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</label><input required type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="Ej: Titanio" className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-medium" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label><select value={form.condition} onChange={e => setForm({...form, condition: e.target.value as DeviceCondition})} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-medium">{Object.values(DeviceCondition).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Precio Costo ($)</label><input required type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-black text-orange-600" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-primary uppercase tracking-widest">Precio Venta ($)</label><input required type="number" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-black text-primary" /></div>
              </div>
              <div className="sticky bottom-0 bg-background-light dark:bg-surface-dark pt-4 flex gap-3">
                {editingId && <button type="button" onClick={() => setConfirmDeleteId(editingId)} className="flex-1 bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold active:scale-95 transition-transform border border-red-500/20">Eliminar</button>}
                <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">{editingId ? 'Guardar Cambios' : 'Publicar iPhone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { DeviceCondition, Product } from '../types';

const COST_ADDITIONS = {
  courrier: 30,
  extras: 10,
  battery: 30,
  workFede: 40,
  workFabri: 40,
  workFeli: 40
};

const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    userRole, inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    businessLiquidity, setBusinessLiquidity
  } = useAppContext();

  const isAdmin = userRole === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [liqInput, setLiqInput] = useState(businessLiquidity.toString());

  // Form State
  const [baseCost, setBaseCost] = useState<number>(0);
  const [additions, setAdditions] = useState({
    courrier: false,
    extras: false,
    battery: false
  });

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

  // Calculate total cost whenever baseCost or additions change
  const totalCalculatedCost = baseCost +
    (additions.courrier ? COST_ADDITIONS.courrier : 0) +
    (additions.extras ? COST_ADDITIONS.extras : 0) +
    (additions.battery ? COST_ADDITIONS.battery : 0) +
    (additions.workFede ? COST_ADDITIONS.workFede : 0) +
    (additions.workFabri ? COST_ADDITIONS.workFabri : 0) +
    (additions.workFeli ? COST_ADDITIONS.workFeli : 0);

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
    setBaseCost(0);
    setAdditions({ courrier: false, extras: false, battery: false });
    setEditingId(null);
    setImageUrlInput('');
    setConfirmDeleteId(null);
  };

  const handleOpenEdit = (product: Product) => {
    setForm(product);
    setBaseCost(product.costPrice); // Al editar, empezamos con el costo guardado como base
    setAdditions({ courrier: false, extras: false, battery: false }); // Reset additions on edit
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      ...form as Product,
      id: editingId || `custom-${Date.now()}`,
      costPrice: totalCalculatedCost, // Usamos el costo calculado
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

  const toggleAddition = (key: keyof typeof additions) => {
    setAdditions(prev => ({ ...prev, [key]: !prev[key] }));
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

  const totalCostInventory = inventory.reduce((acc, p) => acc + (p.costPrice || 0), 0);
  const totalPotentialSales = inventory.reduce((acc, p) => acc + p.price, 0);
  const totalPotentialGain = totalPotentialSales - totalCostInventory;

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
        </div>

        {/* Acciones Rápidas */}
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="w-full flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Añadir Nuevo iPhone</span>
        </button>

        {/* Inventario */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 pl-1 tracking-widest">Inventario</h3>
          <div className="space-y-3">
            {inventory.map(p => {
              const gain = p.price - (p.costPrice || 0);
              const isConfirming = confirmDeleteId === p.id;
              return (
                <div key={p.id} className="relative flex flex-col p-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  {isConfirming && (
                    <div className="absolute inset-0 z-10 bg-red-600/95 flex flex-col items-center justify-center p-4 text-white">
                      <p className="text-sm font-bold mb-3">¿Eliminar este iPhone?</p>
                      <div className="flex gap-4 w-full">
                        <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-lg bg-white/20 font-bold text-xs">Cancelar</button>
                        <button onClick={() => execDelete(p.id)} className="flex-1 py-2 rounded-lg bg-white text-red-600 font-bold text-xs">Confirmar</button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} className="w-12 h-12 object-contain rounded-lg" />
                      <div>
                        <p className="text-sm font-black">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.storage}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400"><span className="material-symbols-outlined">edit</span></button>
                      <button onClick={() => setConfirmDeleteId(p.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center"><p className="text-[8px] uppercase text-slate-400 font-black">Costo</p><p className="text-xs font-bold">${p.costPrice}</p></div>
                    <div className="text-center"><p className="text-[8px] uppercase text-primary font-black">Venta</p><p className="text-xs font-bold">${p.price}</p></div>
                    <div className="text-center"><p className="text-[8px] uppercase text-emerald-500 font-black">Ganancia</p><p className="text-xs font-black text-emerald-400">+${gain}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Edición / Creación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md bg-background-light dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark">
              <h2 className="text-xl font-bold">{editingId ? 'Editar iPhone' : 'Nuevo iPhone'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar pb-10">
              {/* Fotos */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL de Imagen</label>
                <div className="flex gap-2">
                  <input type="text" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://..." className="flex-1 bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm" />
                  <button type="button" onClick={handleAddImageUrl} className="bg-primary text-white w-12 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">add</span></button>
                </div>
              </div>

              {/* Datos Básicos */}
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label><input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm font-bold" /></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacenamiento</label><select value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"><option>64GB</option><option>128GB</option><option>256GB</option><option>512GB</option><option>1TB</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batería</label><input required type="text" value={form.batteryHealth} onChange={e => setForm({ ...form, batteryHealth: e.target.value })} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm" /></div>
              </div>

              {/* SECCIÓN DE COSTOS DINÁMICOS */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Costo Base ($)</label>
                  <input
                    required
                    type="number"
                    value={baseCost}
                    onChange={e => setBaseCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl p-3 text-lg font-black text-orange-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adicionales</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAddition('courrier')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.courrier ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                      Courrier ($30)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAddition('battery')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.battery ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">battery_charging_full</span>
                      Batería ($30)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAddition('extras')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.extras ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_box</span>
                      Extras ($10)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAddition('workFede')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.workFede ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_box</span>
                      Work Fede ($40)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAddition('workFabri')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.workFabri ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_box</span>
                      Work Fabri ($40)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAddition('workFeli')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${additions.workFeli ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_box</span>
                      Work Feli ($40)
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400">Costo Final Calculado</span>
                  <span className="text-xl font-black text-orange-600">${totalCalculatedCost}</span>
                </div>
              </div>

              {/* Precio de Venta */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Precio Venta ($)</label>
                <input required type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-xl font-black text-primary" />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                {editingId ? 'Guardar Cambios' : 'Publicar iPhone'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;
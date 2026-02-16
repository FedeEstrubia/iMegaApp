
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { DeviceCondition, Product } from '../types';
import { supabase } from '../services/supabase';

const COST_ADDITIONS = {
  courrier: 30,
  extras: 10,
  battery: 30,
  workFede: 40,
  workFabri: 40,
  workFeli: 40
};

const IPHONE_CONFIG: Record<string, string[]> = {
  "iPhone 15": ["128GB", "256GB", "512GB"],
  "iPhone 15 Plus": ["128GB", "256GB", "512GB"],
  "iPhone 15 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 15 Pro Max": ["256GB", "512GB", "1TB"],

  "iPhone 14": ["128GB", "256GB", "512GB"],
  "iPhone 14 Plus": ["128GB", "256GB", "512GB"],
  "iPhone 14 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 14 Pro Max": ["128GB", "256GB", "512GB", "1TB"],

  "iPhone 13": ["128GB", "256GB", "512GB"],
  "iPhone 13 Pro": ["128GB", "256GB", "512GB", "1TB"],
  "iPhone 13 Pro Max": ["128GB", "256GB", "512GB", "1TB"],
};

const CASE_TYPES = [
  "Silicon Case",
  "Magsafe Transparente",
  "Glass Case",
  "Walden",
  "Magnetic",
  "Matte",
  "NorthFace Plástica",
  "Puffer Plástica",
  "NorthFace Cocida"
];

const COMPATIBLE_MODELS = [
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 13 Pro Max"
];

const CASE_COLORS = [
  "Negro",
  "Blanco",
  "Transparente",
  "Beige",
  "Azul",
  "Rosa",
  "Rojo"
];

const ACCESSORY_OPTIONS = [
  "Cargador Original 20W",
  "Cargador Replica 20W",
  "AirPods Pro 2 Gen",
  "Cable USB C to Lightning Original",
  "Cable USB C to Lightning Replica",
  "Cable USB C to C Original",
  "Cable USB C to C Replica"
];




const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    userRole,
    inventory,
    cases,
    accessories,
    addInventoryItem,
    addCaseItem,
    addAccessoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    businessLiquidity,
    setBusinessLiquidity,
    updateCaseItem,
    updateAccessoryItem,
    deleteCaseItem,
    deleteAccessoryItem,
    sellCaseItem,
    sellAccessoryItem,

  } = useAppContext();


  const isAdmin = userRole === 'admin';

  const allProducts = [
    ...inventory,
    ...cases,
    ...accessories
  ];



  const [activeCategory, setActiveCategory] = useState<'phones' | 'cases' | 'accessories'>('phones');

  const currentList =
    activeCategory === 'phones'
      ? inventory
      : activeCategory === 'cases'
        ? cases
        : accessories;

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [liqInput, setLiqInput] = useState(businessLiquidity.toString());
  const [uploading, setUploading] = useState(false);

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

    // 1. Restaurar el estado de los checkboxes desde 'specs'
    const restoredAdditions = {
      courrier: product.specs?.some(s => s.label === 'addition_courrier') || false,
      extras: product.specs?.some(s => s.label === 'addition_extras') || false,
      battery: product.specs?.some(s => s.label === 'addition_battery') || false,
      workFede: product.specs?.some(s => s.label === 'addition_workFede') || false,
      workFabri: product.specs?.some(s => s.label === 'addition_workFabri') || false,
      workFeli: product.specs?.some(s => s.label === 'addition_workFeli') || false,
    };

    // 2. Calcular cuánto costaron esos extras
    const extrasCost =
      (restoredAdditions.courrier ? COST_ADDITIONS.courrier : 0) +
      (restoredAdditions.extras ? COST_ADDITIONS.extras : 0) +
      (restoredAdditions.battery ? COST_ADDITIONS.battery : 0) +
      (restoredAdditions.workFede ? COST_ADDITIONS.workFede : 0) +
      (restoredAdditions.workFabri ? COST_ADDITIONS.workFabri : 0) +
      (restoredAdditions.workFeli ? COST_ADDITIONS.workFeli : 0);

    // 3. Restaurar el costo BASE original (Costo Total - Extras)
    setBaseCost((product.costPrice || 0) - extrasCost);
    setAdditions(restoredAdditions);

    setEditingId(product.id);
    setShowModal(true);
  };

  const execDelete = async (id: string) => {
    if (activeCategory === 'phones') {
      await deleteInventoryItem(id);
    } else if (activeCategory === 'cases') {
      await deleteCaseItem(id);
    } else {
      await deleteAccessoryItem(id);
    }

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (data) {
        const publicUrl = data.publicUrl;
        setForm(prev => ({
          ...prev,
          imageUrl: prev.imageUrl ? prev.imageUrl : publicUrl,
          thumbnails: [...(prev.thumbnails || []), publicUrl]
        }));
      }

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Preparar specs básicos
    let finalSpecs = [
      { label: 'Salud Batería', value: form.batteryHealth || '100%', icon: 'battery_full' },
      { label: 'Estado', value: form.condition || 'Nuevo', icon: 'stars' },
      { label: 'Color', value: form.color || 'N/A', icon: 'palette' },
    ];

    // Si es iPhone, agregar los 'flags' de costos adicionales a los specs para persistencia
    if (activeCategory === 'phones') {
      if (additions.courrier) finalSpecs.push({ label: 'addition_courrier', value: 'true', icon: 'local_shipping' });
      if (additions.extras) finalSpecs.push({ label: 'addition_extras', value: 'true', icon: 'add_box' });
      if (additions.battery) finalSpecs.push({ label: 'addition_battery', value: 'true', icon: 'battery_charging_full' });
      if (additions.workFede) finalSpecs.push({ label: 'addition_workFede', value: 'true', icon: 'engineering' });
      if (additions.workFabri) finalSpecs.push({ label: 'addition_workFabri', value: 'true', icon: 'engineering' });
      if (additions.workFeli) finalSpecs.push({ label: 'addition_workFeli', value: 'true', icon: 'engineering' });
    }

    const productData: Product = {
      ...form as Product,

      costPrice: totalCalculatedCost,
      thumbnails: form.thumbnails || [],
      specs: finalSpecs
    };

    console.log('Submitting Product:', {
      editingId,
      activeCategory,
      productData
    });

    try {
      if (editingId) {
        const finalProduct = { ...productData, id: editingId };

        if (activeCategory === 'phones') {
          await updateInventoryItem(finalProduct);
        } else if (activeCategory === 'cases') {
          await updateCaseItem(finalProduct);
        } else {
          await updateAccessoryItem(finalProduct);
        }
      }
      else {
        // 🟢 MODO CREACIÓN
        console.log('Creating new item in category:', activeCategory);
        if (activeCategory === 'phones') {
          console.log('Calling addInventoryItem...');
          await addInventoryItem(productData);
          console.log('addInventoryItem finished.');
        } else if (activeCategory === 'cases') {
          await addCaseItem(productData);
        } else {
          await addAccessoryItem(productData);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error al guardar: ' + error);
    }
  };


  const handleUpdateLiquidity = async () => {
    const val = parseFloat(liqInput);
    if (isNaN(val)) return;

    const { error } = await supabase
      .from('settings')
      .update({ value: val })
      .eq('key', 'liquidity');

    if (error) {
      console.error('Error actualizando liquidez:', error);
      return;
    }

    setBusinessLiquidity(val);
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

  const soldHistory = [...inventory, ...cases, ...accessories].filter(p => p.status === 'sold');

  const markAsSold = async (product: Product) => {
    const confirmSale = window.confirm(
      `¿Confirmar venta de ${product.name}?\n\nEsto generará movimientos financieros.`
    );

    if (!confirmSale) return;

    console.log('--- Starting Sale Process ---');
    console.log('Product:', product);

    // 1. Calculate Financials (Force Numbers)
    const price = Number(product.price);
    const cost = Number(product.costPrice || 0);
    const profit = price - cost;

    console.log('Financials:', { price, cost, profit });

    if (isNaN(price)) {
      alert('Error: El precio del producto no es válido.');
      return;
    }

    // 2. Partner Logic (Best Effort) - Non-blocking
    try {
      if (profit > 0) {
        const { data: partners, error: partnersError } = await supabase
          .from('partners')
          .select('*')
          .eq('active', true);

        if (partnersError) throw partnersError;

        if (partners) {
          for (const partner of partners) {
            if (partner.role !== 'partner') continue;
            const partnerShare = (profit * partner.profit_percent) / 100;
            // Best effort insert
            await supabase.from('partner_ledger').insert({
              partner_id: partner.id,
              type: 'profit',
              amount_usd: partnerShare,
              note: `Venta ${product.name}`
            });
          }
          console.log('Partner ledger updated.');
        }
      } else {
        console.log('No profit to distribute (profit <= 0).');
      }
    } catch (error) {
      console.error('Error updating partner ledger (non-critical):', error);
      // We continue because the sale itself is more important
    }

    // 3. Mark Item as Sold (Critical)
    try {
      if (activeCategory === 'phones') {
        await updateInventoryItem({ ...product, status: 'sold' });
      } else if (activeCategory === 'cases') {
        await sellCaseItem(product.id);
      } else {
        await sellAccessoryItem(product.id);
      }
      console.log('Item marked as sold.');
    } catch (error) {
      console.error('Error marking item as sold:', error);
      alert('Error crítico al actualizar el estado del producto: ' + JSON.stringify(error));
      return; // Stop here if we can't mark as sold
    }

    // 4. Update Liquidity (Critical)
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'liquidity')
        .single();

      if (settingsError) throw settingsError;

      const currentLiquidity = Number(settingsData?.value || 0);
      const newLiquidity = currentLiquidity + price;

      console.log('Liquidity Update:', { current: currentLiquidity, add: price, new: newLiquidity });

      const { error: updateError } = await supabase
        .from('settings')
        .update({ value: newLiquidity })
        .eq('key', 'liquidity');

      if (updateError) throw updateError;

      setBusinessLiquidity(newLiquidity);
      alert("Venta registrada y liquidez actualizada.");

    } catch (error) {
      console.error('Error updating liquidity:', error);
      alert('Venta registrada, pero hubo un error actualizando la liquidez.');
    }
  };

  const isPhone = activeCategory === 'phones';
  const isCase = activeCategory === 'cases';
  const isAccessory = activeCategory === 'accessories';


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
          <span>
            {activeCategory === 'phones' && 'Añadir Nuevo iPhone'}
            {activeCategory === 'cases' && 'Añadir Nueva Funda'}
            {activeCategory === 'accessories' && 'Añadir Nuevo Accesorio'}
          </span>

        </button>
        <button
          onClick={() => navigate('/admin/partners')}
          className="w-full flex items-center justify-center gap-3 p-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">account_balance</span>
          <span>Balance Socios</span>
        </button>
        {/* Filtros por categoría */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory('phones')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${activeCategory === 'phones'
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-800'
              }`}
          >
            iPhones
          </button>

          <button
            onClick={() => setActiveCategory('cases')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${activeCategory === 'cases'
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-800'
              }`}
          >
            Fundas
          </button>

          <button
            onClick={() => setActiveCategory('accessories')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold ${activeCategory === 'accessories'
              ? 'bg-primary text-white'
              : 'bg-slate-200 dark:bg-slate-800'
              }`}
          >
            Accesorios
          </button>
        </div>

        {/* Inventario */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-400 pl-1 tracking-widest">Inventario</h3>
          <div className="space-y-3">
            {currentList.filter(p => p.status !== 'sold' || !p.status).map(p => {
              const gain = p.price - (p.costPrice || 0);
              const isConfirming = confirmDeleteId === p.id;
              return (
                <div key={p.id} className="relative flex flex-col p-4 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  {p.status === 'sold' && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                      Vendido
                    </div>
                  )}


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
                      {p.status !== 'sold' && (
                        <button
                          onClick={() => markAsSold(p)}
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600"
                          title="Marcar como vendido"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
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

        {/* Historial de Ventas */}
        <div className="space-y-4 mt-10">
          <h3 className="text-xs font-black uppercase text-slate-400 pl-1 tracking-widest">
            Historial de Ventas
          </h3>

          <div className="space-y-3">
            {soldHistory
              .map(p => {
                const gain = p.price - (p.costPrice || 0);

                return (
                  <div
                    key={p.id}
                    className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl"
                  >
                    <div className="flex justify-between">
                      <p className="font-bold">{p.name}</p>
                      <p className="text-emerald-500 font-bold">
                        +${gain}
                      </p>
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      Vendido por ${p.price}
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
              <h2 className="text-xl font-bold">{editingId
                ? 'Guardar Cambios'
                : activeCategory === 'phones'
                  ? 'Publicar iPhone'
                  : activeCategory === 'cases'
                    ? 'Publicar Funda'
                    : 'Publicar Accesorio'
              }
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar pb-10">
              {/* Fotos */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imágenes del Producto</label>

                <div className="flex gap-2 items-center">
                  <label className={`flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <div className="bg-primary/10 text-primary p-3 rounded-full mb-2">
                      <span className="material-symbols-outlined">add_a_photo</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {uploading ? 'Subiendo...' : 'Subir Imagen'}
                    </span>
                  </label>
                </div>

                {/* Preview de Thumbnails */}
                {form.thumbnails && form.thumbnails.length > 0 && (
                  <div className="flex overflow-x-auto gap-2 py-2 no-scrollbar">
                    <div className="flex gap-2">
                      {form.thumbnails.map((thumb, index) => (
                        <div key={index} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={thumb} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const newThumbs = form.thumbnails?.filter((_, i) => i !== index);
                              setForm(prev => ({
                                ...prev,
                                thumbnails: newThumbs,
                                imageUrl: (prev.imageUrl === thumb && newThumbs && newThumbs.length > 0) ? newThumbs[0] : (newThumbs?.length === 0 ? '' : prev.imageUrl)
                              }));
                            }}
                            className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl-lg hover:bg-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[10px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Básicos */}

              {isPhone && (<> <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Modelo
                </label>

                <select
                  value={form.name || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      storage: ""
                    })
                  }
                  className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                >
                  <option value="">Seleccionar modelo</option>

                  {Object.keys(IPHONE_CONFIG).map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>


              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacenamiento</label>

                    <select
                      value={form.storage || ""}
                      onChange={e => setForm({ ...form, storage: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar almacenamiento</option>

                      {form.name &&
                        IPHONE_CONFIG[form.name]?.map(storage => (
                          <option key={storage} value={storage}>
                            {storage}
                          </option>
                        ))}
                    </select>



                  </div>
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
                </div> </>)}
              {isCase && (
                <>
                  {/* Tipo de Funda */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Modelo de Funda
                    </label>

                    <select
                      value={form.name || ""}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar tipo</option>
                      {CASE_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Compatible */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Compatible con
                    </label>

                    <select
                      value={form.storage || ""}
                      onChange={(e) =>
                        setForm({ ...form, storage: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar modelo</option>
                      {COMPATIBLE_MODELS.map(model => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Color
                    </label>

                    <select
                      value={form.color || ""}
                      onChange={(e) =>
                        setForm({ ...form, color: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar color</option>
                      {CASE_COLORS.map(color => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {isAccessory && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Accesorio</label>
                    <select
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                    >
                      <option value="">Seleccionar accesorio</option>
                      {ACCESSORY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo ($)</label>
                    <input
                      required
                      type="number"
                      value={form.costPrice || ''}
                      onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}


              {/* Precio de Venta */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest">Precio Venta ($)</label>
                <input required type="number" value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="w-full bg-white dark:bg-slate-800 border-0 rounded-xl p-3 text-xl font-black text-primary" />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                {editingId ? 'Guardar Cambios' : 'Publicar'}
              </button>
            </form>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default AdminScreen;

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DeviceCondition } from '../types';
import { useAppContext } from '../AppContext';

const MarketplaceScreen: React.FC = () => {
  const { addToCart, toggleSaved, isSaved, cart, userRole, inventory, user } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const userEmail = user?.email;
  const profilePath = userEmail ? "/profile" : "/login";

  const filters = ['Todos', 'iPhone 15', 'Pro Max', 'Reacondicionado', 'Accesorios'];

  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'Todos' ||
        p.name.includes(activeFilter) ||
        (activeFilter === 'Reacondicionado' && p.condition === DeviceCondition.REFURBISHED);
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, inventory]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = userRole === 'admin';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-12 pb-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50">
        <h2 className="text-xl font-bold leading-tight tracking-tight flex-1">iMega</h2>
        <div className="flex items-center gap-4">
          <Link to={profilePath} className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden cursor-pointer border border-primary/20">
            <img alt="Perfil" className="h-full w-full object-cover" src={userEmail ? `https://picsum.photos/seed/${userEmail.split('@')[0]}/100/100` : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} />
          </Link>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="px-5 py-3">
        <div className="group flex w-full items-center rounded-lg bg-white dark:bg-surface-dark shadow-sm border border-gray-200 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary">
          <div className="flex items-center justify-center pl-4 text-gray-400 dark:text-secondary-text">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            className="w-full flex-1 bg-transparent px-3 py-3 border-0 active:border-0 focus:border-0 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-secondary-text focus:outline-none"
            placeholder="Buscar dispositivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex gap-3 px-5 min-w-max">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex h-9 items-center justify-center px-5 rounded-full transition-all active:scale-95 ${activeFilter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}
            >
              <span className={`text-sm ${activeFilter === f ? 'font-semibold' : 'font-medium'}`}>{f}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="px-5 py-4">
          {/*<Link to="/product/15-pro-max" className="block relative w-full h-48 rounded-xl overflow-hidden shadow-lg group cursor-pointer">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-primary opacity-80 z-10"></div>
            <div className="absolute inset-0 bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBR5Izyj_DmAYl2q5CwyScxnvWbkWz4GlhegXOdnMRCi9kxUz1-ctJyQk-VFCYBlIq-jGaHDddM0BdAPydoUxCthDPHT_rK2pSTP2UPh0Z1UxbwDSMucABqjgQbI5oO0HGcSChqeLNW7iFs5-aWssEccDujH2x9AZ3tv5FhInXmNPuUnwR1pbT0jxTfWoNlWumtbyyYN7zFsV1_ZSpmvJemUL5Ji_qkBjRuH6QLpSwXglmuhNOdnKtq6NNAKvLo44ROY4ow2GhBzpY')" }}></div>
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6">
              <span className="text-primary-100 text-xs font-bold uppercase tracking-wider mb-2 bg-primary/30 w-fit px-2 py-1 rounded backdrop-blur-sm">Recién Llegado</span>
              <h3 className="text-white text-2xl font-bold mb-1">iPhone 15 Pro</h3>
              <p className="text-gray-200 text-sm mb-4 max-w-[70%]">Diseño de titanio. Chip A17 Pro.</p>
              <span className="bg-white text-primary text-sm font-bold py-2 px-4 rounded-lg w-fit hover:bg-gray-100 transition-colors">Ver Oferta</span>
            </div>






          </Link>*/}
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 pb-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-md transition-shadow">
              <Link to={`/product/${product.id}`} className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-[#111a22] rounded-lg overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    className={`flex items-center justify-center h-8 w-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm transition-colors ${isSaved(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(product.id); }}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSaved(product.id) ? 'font-variation-settings-fill' : ''}`}>favorite</span>
                  </button>
                </div>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 will-change-transform image-crisp"
                  loading="lazy"
                />
              </Link>
              <div className="flex flex-col gap-1">
                <h3 className="text-gray-900 dark:text-white text-sm font-semibold leading-tight line-clamp-1">{product.name}</h3>
                <p className="text-secondary-text text-xs font-medium">{product.storage}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-primary text-base font-bold">${product.price}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Unificada */}
      <nav className="absolute bottom-0 w-full z-40 bg-background-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 px-2 pt-2 pb-6">
        <div className="flex items-center justify-around">
          <Link to="/" className="group flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-primary">
            <span className="material-symbols-outlined text-[24px] font-variation-settings-fill">home</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          <Link to="/saved" className="group flex flex-1 flex-col items-center justify-end gap-1 text-gray-400 dark:text-secondary-text">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
            <span className="text-[10px] font-medium">Favoritos</span>
          </Link>
          <Link to="/cart" className="group flex flex-1 flex-col items-center justify-end gap-1 text-gray-400 dark:text-secondary-text">
            <div className="relative">
              <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">{cartCount}</span>}
            </div>
            <span className="text-[10px] font-medium">Carrito</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="group flex flex-1 flex-col items-center justify-end gap-1 text-gray-400 dark:text-secondary-text">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
          <Link to={profilePath} className="group flex flex-1 flex-col items-center justify-end gap-1 text-gray-400 dark:text-secondary-text">
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="text-[10px] font-medium">Cuenta</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MarketplaceScreen;

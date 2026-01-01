
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const AccessoriesScreen: React.FC = () => {
    const { addToCart, toggleSaved, isSaved, cart, userRole, inventory, user } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'Fundas' | 'Accesorios'>('Fundas');

    const userEmail = user?.email;
    const profilePath = userEmail ? "/profile" : "/login";

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const isAdmin = userRole === 'admin';

    // Filter logic:
    // 1. Base: Filter out main iPhones/Devices unless they are explicitly accessories (checked by name keywords).
    //    Actually, simpler: Filter by name inclusions/exclusions.
    // 2. Tab 'Fundas': Name includes 'funda' or 'case'.
    // 3. Tab 'Accesorios': Everything else that isn't a Phone.

    const filteredProducts = useMemo(() => {
        return inventory.filter(p => {
            const name = p.name.toLowerCase();
            // Search query check
            if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;

            const isCase = name.includes('funda') || name.includes('case') || name.includes('carcasa') || name.includes('protector');

            // Heuristic for "Main Device" (iPhone 12, 13, etc) -> usually doesn't have "funda" but has "iphone"
            // But we want to exclude Phones from 'Accesorios' tab.
            // So 'Accesorios' tab = (!Phone AND !Case) OR (Explicit Accessory Keywords like Charger, Cable, Watch, AirPods)

            if (activeTab === 'Fundas') {
                return isCase;
            } else {
                // Accesorios: Not a case, and matches accessory keywords OR simply is not a raw iPhone.
                // Let's rely on exclusion of "Funda" and also exclusion of typical phone names if no specific keyword found.
                if (isCase) return false;

                // Check for specific accessory keywords
                const isAccessoryKeyword = /cargador|cable|adapter|adaptador|airpods|watch|auricular|magsafe|soporte|vidrio|glass/i.test(name);

                if (isAccessoryKeyword) return true;

                // If it's an iPhone without case/glass keywords, it's likely a phone. Exclude.
                // This assumes inventory names are cleaner.
                const isPhone = name.includes('iphone') && !isAccessoryKeyword;

                return !isPhone;
            }
        });
    }, [inventory, activeTab, searchQuery]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-12 pb-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50">
                <h2 className="text-xl font-bold leading-tight tracking-tight flex-1">Accesorios</h2>
                <div className="flex items-center gap-4">
                    <Link to={profilePath} className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden cursor-pointer border border-primary/20">
                        <img alt="Perfil" className="h-full w-full object-cover" src={userEmail ? `https://picsum.photos/seed/${userEmail.split('@')[0]}/100/100` : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} />
                    </Link>
                </div>
            </header>

            {/* Search */}
            <div className="px-5 py-3">
                <div className="group flex w-full items-center rounded-lg bg-white dark:bg-surface-dark shadow-sm border border-gray-200 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary">
                    <div className="flex items-center justify-center pl-4 text-gray-400 dark:text-secondary-text">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </div>
                    <input
                        className="w-full flex-1 bg-transparent px-3 py-3 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-secondary-text focus:outline-none"
                        placeholder={`Buscar en ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-4">
                <div className="flex p-1 bg-gray-100 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('Fundas')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Fundas' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Fundas
                    </button>
                    <button
                        onClick={() => setActiveTab('Accesorios')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Accesorios' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Accesorios
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-6 opacity-60">
                        <span className="material-symbols-outlined text-4xl mb-2">grid_off</span>
                        <p className="text-sm">No se encontraron productos en esta sección.</p>
                    </div>
                ) : (
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
                                    <h3 className="text-gray-900 dark:text-white text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5em]">{product.name}</h3>
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
                )}
            </div>

            {/* Navigation (Reused) */}
            <nav className="absolute bottom-0 w-full z-40 bg-background-light/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 px-2 pt-2 pb-6">
                <div className="flex items-center justify-around">
                    <Link to="/" className="group flex flex-1 flex-col items-center justify-end gap-1 text-gray-400 dark:text-secondary-text">
                        <span className="material-symbols-outlined text-[24px]">smartphone</span>
                        <span className="text-[10px] font-medium">Celulares</span>
                    </Link>
                    <Link to="/accessories" className="group flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-primary">
                        <span className="material-symbols-outlined text-[24px] font-variation-settings-fill">headphones</span>
                        <span className="text-[10px] font-medium">Accesorios</span>
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
                </div>
            </nav>
        </div>
    );
};

export default AccessoriesScreen;

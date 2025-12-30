
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const SavedScreen: React.FC = () => {
  const { savedIds, toggleSaved, addToCart, inventory } = useAppContext();

  const savedProducts = inventory.filter(p => savedIds.includes(p.id));

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      {/* Header con Link directo para máxima compatibilidad */}
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-12">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-bold">Mis Favoritos</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-24">
        {savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-slate-300">favorite</span>
            <p className="text-slate-500 font-medium">No tienes productos guardados</p>
            <Link to="/" className="text-primary font-bold">Ver catálogo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {savedProducts.map(product => (
              <div key={product.id} className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 group hover:shadow-md transition-shadow">
                <Link to={`/product/${product.id}`} className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute top-2 right-2 z-10">
                    <button 
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm text-red-500 active:scale-90 transition-transform"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(product.id); }}
                    >
                      <span className="material-symbols-outlined text-[18px] font-variation-settings-fill">favorite</span>
                    </button>
                  </div>
                  <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                </Link>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold truncate text-slate-900 dark:text-white">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-primary font-bold">${product.price}</p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedScreen;

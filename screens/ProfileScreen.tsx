
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { REWARD_HISTORY } from '../constants';
import { useAppContext } from '../AppContext';
import { supabase } from '../services/supabase';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    user,
    session,
    userRole,
    userDevice,
    getCurrentTier
  } = useAppContext();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const userEmail = user?.email || session?.user?.email || '';
  const userName = userEmail ? userEmail.split('@')[0] : 'Usuario';
  const isAdmin = userRole === 'admin';
  const currentTier = getCurrentTier();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('simulatedTier');
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-12">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-semibold">Mi Perfil</h1>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 pb-28 overflow-y-auto no-scrollbar">
        {/* User Card */}
        <div className="flex items-center gap-4 p-2">
          <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-primary">
            <img src={`https://picsum.photos/seed/${userName}/100/100`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold capitalize">{userName}</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">{userEmail}</p>
              {isAdmin && <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md">Admin</span>}
            </div>
          </div>
        </div>



        {/* Mi iPhone */}
        {userDevice && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-[0.2em]">Mi iPhone</h3>
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden group">
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl text-primary/5 group-hover:text-primary/10 transition-colors">smartphone</span>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{userDevice.model}</h4>
                    <p className="text-sm text-slate-500">{userDevice.storage} • {userDevice.color}</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Propio</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Comprado en</p>
                    <p className="text-xs font-bold">{formatDate(userDevice.purchaseDate)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Costo Original</p>
                    <p className="text-xs font-black text-primary">${userDevice.purchasePrice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Status */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-[0.2em]">Membresía</h3>
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
              <span className="text-xs font-black text-primary uppercase tracking-widest">{currentTier}</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-1 text-slate-900 dark:text-white">1,250</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Puntos Acumulados</p>

            <div className="w-full space-y-2 text-left">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                <span>Siguiente Nivel</span>
                <span>750 pts faltantes</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "62%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-[0.2em]">Actividad</h3>
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
            {REWARD_HISTORY.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-500 text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-500">+{item.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Nav */}
      <nav className="fixed bottom-0 w-full max-w-md bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe pt-2">
        <div className="flex items-center justify-around h-16">
          <Link to="/" className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <span className="material-symbols-outlined text-2xl">home</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          <Link to="/saved" className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <span className="material-symbols-outlined text-2xl">favorite</span>
            <span className="text-[10px] font-medium">Favoritos</span>
          </Link>
          <Link to="/cart" className="flex flex-1 flex-col items-center gap-1 text-slate-500">
            <div className="relative">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-white font-bold">{cartCount}</span>}
            </div>
            <span className="text-[10px] font-medium">Carrito</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex flex-1 flex-col items-center gap-1 text-slate-500">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          )}
          <Link to="/profile" className="flex flex-1 flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined text-2xl font-variation-settings-fill">person</span>
            <span className="text-[10px] font-medium">Cuenta</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default ProfileScreen;

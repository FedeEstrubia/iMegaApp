
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { MembershipTier } from '../types';

const MembershipScreen: React.FC = () => {
  const navigate = useNavigate();
  const { getCurrentTier, userPoints } = useAppContext();
  const currentTier = getCurrentTier();

  const getTierMeta = (tier: MembershipTier) => {
    switch (tier) {
      case 'Bronce': return 500;
      case 'Plata': return 2000;
      case 'Oro': return 5000;
      case 'Diamante': return 10000;
      default: return 500;
    }
  };

  const meta = getTierMeta(currentTier);
  const progress = Math.min(100, (userPoints / meta) * 100);

  const tiers = [
    { name: 'Bronce' as MembershipTier, points: '0 - 499 pts', discount: '0%', features: ['Acceso Estándar', 'Envío Estándar Gratis'] },
    { name: 'Plata' as MembershipTier, points: '500 - 1,999 pts', discount: '5%', features: ['Soporte Prioritario', 'Acceso Anticipado a Ofertas'] },
    { name: 'Oro' as MembershipTier, points: '2,000 - 4,999 pts', discount: '10%', features: ['Envío Express Gratis', 'Acceso a Eventos Exclusivos'] },
    { name: 'Diamante' as MembershipTier, points: '5,000+ pts', discount: '15%', features: ['Concierge Personal', 'Regalos Exclusivos', 'Máxima Prioridad'] }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Niveles de Membresía</h2>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
        {/* Current Status */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-dark p-6 shadow-lg">
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase mb-1">Estado Actual</p>
              <h1 className="text-2xl font-bold text-white">Nivel {currentTier}</h1>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-white">{userPoints.toLocaleString()} Puntos</span>
                <span className="text-slate-400">Meta: {meta.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-700/50">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tiers.map(tier => {
            const isCurrent = tier.name === currentTier;
            return (
              <div key={tier.name} className={`relative flex flex-col gap-4 rounded-xl border p-5 ${isCurrent ? 'border-primary bg-white dark:bg-surface-dark shadow-lg ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase text-white">
                    Nivel Actual
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-lg font-bold ${isCurrent ? 'text-primary' : ''}`}>{tier.name}</h4>
                    <span className="text-xs text-slate-500">{tier.points}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>{tier.discount}</span>
                    <span className="text-xs font-bold text-slate-400">OFF</span>
                  </div>
                </div>
                <div className="h-px w-full bg-slate-100 dark:bg-slate-700"></div>
                <ul className="space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MembershipScreen;

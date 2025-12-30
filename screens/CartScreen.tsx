
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    userDevice, 
    useTradeIn, 
    setUseTradeIn, 
    calculateTradeInValue,
    calculateDowngradeCash,
    confirmPurchase,
    getCurrentTier,
    getTierDiscount
  } = useAppContext();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const subtotalRaw = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tierDiscount = getTierDiscount();
  const discountAmount = Math.floor(subtotalRaw * tierDiscount);
  const subtotalAfterDiscount = subtotalRaw - discountAmount;
  
  const tradeInValue = useTradeIn ? calculateTradeInValue() : 0;
  
  const { cash, isViable, reason } = calculateDowngradeCash();
  
  // Si hay devolución de efectivo, el total a pagar es 0
  const finalToPay = cash > 0 ? 0 : Math.max(0, subtotalAfterDiscount - tradeInValue);

  const handleCheckout = () => {
    confirmPurchase();
    alert(cash > 0 ? `Downgrade completado. Recibirás $${cash} en efectivo.` : "Compra realizada con éxito.");
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 pt-12">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">Mi Carrito</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-64">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-6xl text-slate-300">shopping_cart</span>
            <p className="text-slate-500 font-medium">Tu carrito está vacío</p>
            <Link to="/" className="text-primary font-bold">Explorar iPhones</Link>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="flex gap-4 p-3 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2">
                  <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">{item.storage} • {item.color}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">${item.price}</span>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-white"><span className="material-symbols-outlined text-sm">remove</span></button>
                      <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-white"><span className="material-symbols-outlined text-sm">add</span></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {userDevice && (
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><span className="material-symbols-outlined">sync_alt</span></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Entregar iPhone</p>
                      <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Plan Trade-In Activo</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setUseTradeIn(!useTradeIn)}
                    className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${useTradeIn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${useTradeIn ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>

                {useTradeIn && cash > 0 && !isViable && (
                   <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                      <span className="material-symbols-outlined text-lg">info</span>
                      <p className="text-[11px] font-bold">{reason}</p>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 w-full max-w-md bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-6 pb-10 space-y-4 shadow-2xl">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900 dark:text-white">${subtotalRaw}.00</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1.5 text-blue-500 font-bold">
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  <span>Ahorro {getCurrentTier()}</span>
                </div>
                <span className="font-bold text-blue-500">-${discountAmount}.00</span>
              </div>
            )}
            
            {useTradeIn && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Entrega {userDevice?.model}</span>
                  </div>
                  <span className="font-bold text-emerald-500">-${tradeInValue}.00</span>
                </div>
                
                {cash > 0 && isViable && (
                   <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 text-orange-500 font-bold">
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      <span>Fee Urgencia</span>
                    </div>
                    <span className="font-bold text-orange-500">+$50.00</span>
                  </div>
                )}
              </>
            )}
            
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-lg font-bold">{cash > 0 && isViable ? "Recibes en efectivo" : "Total a pagar"}</span>
              <span className={`text-2xl font-black ${cash > 0 && isViable ? "text-emerald-500" : "text-primary"}`}>
                ${cash > 0 && isViable ? cash : finalToPay}.00
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={useTradeIn && cash > 0 && !isViable}
            className={`w-full h-14 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${useTradeIn && cash > 0 && !isViable ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary text-white shadow-primary/20 active:scale-[0.98]'}`}
          >
            {cash > 0 && isViable ? "Confirmar Downgrade" : "Pagar ahora"}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartScreen;

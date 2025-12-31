
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, PurchasedDevice, UserRole, MembershipTier } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { supabase } from './services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AppContextType {
  inventory: Product[];
  cart: CartItem[];
  savedIds: string[];
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  userRole: UserRole;
  userTier: MembershipTier;
  userPoints: number;
  userDevice: PurchasedDevice | null;
  useTradeIn: boolean;
  businessLiquidity: number;
  setUserRole: (role: UserRole) => void;
  setUseTradeIn: (val: boolean) => void;
  setBusinessLiquidity: (val: number) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  toggleSaved: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  addInventoryItem: (product: Product) => void;
  updateInventoryItem: (product: Product) => void;
  deleteInventoryItem: (productId: string) => void;
  calculateTradeInValue: () => number;
  calculateDowngradeCash: () => { cash: number; isViable: boolean; reason?: string };
  confirmPurchase: () => void;
  getCurrentTier: () => MembershipTier;
  getTierDiscount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const URGENCY_FEE = 50;
const LIQUIDITY_BUFFER = 500;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<Product[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedIds');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<UserRole>('client');
  const [userTier, setUserTier] = useState<MembershipTier>('Bronce');
  const [userPoints, setUserPoints] = useState<number>(0);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, membership_tier, points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUserRoleState(data.role as UserRole);
        setUserTier(data.membership_tier as MembershipTier);
        setUserPoints(data.points || 0);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial session check
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
        setAuthLoading(false);
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserRoleState('client'); // Reset to default on logout
        setUserTier('Bronce');
        setUserPoints(0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const [userDevice, setUserDevice] = useState<PurchasedDevice | null>(() => {
    const saved = localStorage.getItem('userDevice');
    return saved ? JSON.parse(saved) : null;
  });

  const [businessLiquidity, setBusinessLiquidity] = useState(() => {
    const saved = localStorage.getItem('businessLiquidity');
    return saved ? parseFloat(saved) : 2500;
  });

  const [useTradeIn, setUseTradeIn] = useState(false);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('savedIds', JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
  };

  const getCurrentTier = (): MembershipTier => {
    return userTier;
  };

  const getTierDiscount = () => {
    const tier = getCurrentTier();
    switch (tier) {
      case 'Diamante': return 0.15;
      case 'Oro': return 0.10;
      case 'Plata': return 0.05;
      default: return 0;
    }
  };

  const calculateTradeInValue = () => {
    if (!userDevice) return 0;
    const purchaseDate = new Date(userDevice.purchaseDate);
    const today = new Date();
    const diffTime = today.getTime() - purchaseDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const fullMonths = Math.floor(totalDays / 30);
    const remainingDays = totalDays % 30;
    const monthsSincePurchase = remainingDays >= 15 ? fullMonths + 1 : fullMonths;
    const fixedCost = monthsSincePurchase < 12 ? 30 : 50;
    const devaluation = monthsSincePurchase * 7;
    const tradeInValue = userDevice.purchasePrice - fixedCost - devaluation;
    return Math.max(0, Math.floor(tradeInValue));
  };

  const calculateDowngradeCash = () => {
    if (!useTradeIn || !userDevice || cart.length === 0) return { cash: 0, isViable: true };
    const tradeInValue = calculateTradeInValue();
    const subtotalRaw = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = subtotalRaw * getTierDiscount();
    const subtotalWithDiscount = subtotalRaw - discount;

    const potentialCash = tradeInValue - subtotalWithDiscount - URGENCY_FEE;

    if (potentialCash <= 0) return { cash: 0, isViable: true };

    const cashOutAvailable = businessLiquidity - LIQUIDITY_BUFFER;
    const isViable = cashOutAvailable >= potentialCash;

    return {
      cash: Math.floor(potentialCash),
      isViable,
      reason: !isViable ? "Esta opción no está disponible en este momento" : undefined
    };
  };

  const confirmPurchase = () => {
    const { cash, isViable } = calculateDowngradeCash();
    if (cash > 0 && isViable) {
      setBusinessLiquidity(prev => prev - cash);
    }
    setCart([]);
    setUseTradeIn(false);
  };

  const addInventoryItem = (product: Product) => setInventory(prev => [product, ...prev]);
  const updateInventoryItem = (product: Product) => setInventory(prev => prev.map(p => p.id === product.id ? product : p));
  const deleteInventoryItem = (productId: string) => {
    setInventory(prev => prev.filter(p => p.id !== productId));
    setCart(prev => prev.filter(p => p.id !== productId));
    setSavedIds(prev => prev.filter(id => id !== productId));
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleSaved = (productId: string) => setSavedIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const isSaved = (productId: string) => savedIds.includes(productId);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
            <span className="material-symbols-outlined text-white text-[32px]">bolt</span>
          </div>
          <p className="text-sm font-medium text-secondary-text animate-pulse">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      inventory, cart, savedIds, user, session, authLoading,
      userRole, userTier, userPoints, userDevice, useTradeIn, businessLiquidity,
      setUserRole, setUseTradeIn, setBusinessLiquidity,
      addToCart, removeFromCart, updateQuantity, toggleSaved, isSaved,
      addInventoryItem, updateInventoryItem, deleteInventoryItem,
      calculateTradeInValue, calculateDowngradeCash, confirmPurchase,
      getCurrentTier, getTierDiscount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

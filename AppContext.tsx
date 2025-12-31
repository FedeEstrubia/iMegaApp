
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, PurchasedDevice, UserRole, MembershipTier } from './types';
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
  const [inventory, setInventory] = useState<Product[]>([]);

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

    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching inventory:', error);
      } else {
        setInventory(data || []);
      }
    };

    initSession();
    fetchInventory();

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

  const confirmPurchase = async () => {
    const { cash, isViable } = calculateDowngradeCash();

    // Logic for liquidity and cash return
    if (cash > 0 && isViable) {
      setBusinessLiquidity(prev => prev - cash);
    }

    if (!user) return; // Cannot save if not logged in

    // 1. Create Purchase Records
    const purchases = cart.map(item => ({
      user_id: user.id,
      product_id: item.id,
      purchase_price: item.price,
      details: item,
      status: 'completed'
    }));

    const { error: purchaseError } = await supabase.from('purchases').insert(purchases);
    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      return;
    }

    // 2. Update Stock (simple decrement for now, can be improved with RPC)
    // Note: This loop is not atomic, in production use a PG function or single batch update if possible
    for (const item of cart) {
      const product = inventory.find(p => p.id === item.id);
      if (product) {
        await supabase.from('products').update({ stock: Math.max(0, (product.stock || 1) - item.quantity) }).eq('id', item.id);
      }
    }

    // 3. Update User Points
    // Calculate points: 1 point per $10 spent (example logic)
    const totalSpent = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newPoints = Math.floor(totalSpent / 10);

    const { error: pointsError } = await supabase.rpc('increment_points', { user_id: user.id, amount: newPoints });

    // Fallback if RPC doesnt exist (update manually)
    if (pointsError) {
      // Fetch current points strictly to be safe, though we have userPoints state
      const { data: currentData } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      const currentPoints = currentData?.points || 0;
      await supabase.from('profiles').update({ points: currentPoints + newPoints }).eq('id', user.id);
    }

    // 4. Refresh Data
    fetchProfile(user.id);
    const { data: refreshedInventory } = await supabase.from('products').select('*').order('name');
    if (refreshedInventory) setInventory(refreshedInventory);

    setCart([]);
    setUseTradeIn(false);
  };

  const addInventoryItem = async (product: Product) => {
    // Remove id if it is custom temporary id, let DB assign UUID
    const { id, ...rest } = product;
    // or if we want to allow custom IDs, keep it. But usually uuid_generate_v4() is better.
    // If the tool sent a custom- timestamp id, we should probably ignore it and let Supabase generate one, 
    // unless we actually want that specific ID.
    // For now, let's try to insert. If product.id is 'custom-...', remove it.
    const payload = id.startsWith('custom-') ? rest : product;

    const { data, error } = await supabase.from('products').insert([payload]).select().single();
    if (error) {
      console.error('Error adding product:', error);
    } else if (data) {
      setInventory(prev => [data, ...prev]);
    }
  };

  const updateInventoryItem = async (product: Product) => {
    const { error } = await supabase.from('products').update(product).eq('id', product.id);
    if (error) {
      console.error('Error updating product:', error);
    } else {
      setInventory(prev => prev.map(p => p.id === product.id ? product : p));
    }
  };

  const deleteInventoryItem = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.error('Error deleting product:', error);
    } else {
      setInventory(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(p => p.id !== productId));
      setSavedIds(prev => prev.filter(id => id !== productId));
    }
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

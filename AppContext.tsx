
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, PurchasedDevice, UserRole, MembershipTier } from './types';
import { supabase } from './services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AppContextType {
  inventory: Product[];
  cases: Product[];
  accessories: Product[];
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
  const [cases, setCases] = useState<Product[]>([]);
  const [accessories, setAccessories] = useState<Product[]>([]);

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

  const fetchInventory = async () => {
    // 1. Fetch Products (Start)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching inventory:', error);
    } else {
      const mappedData = (data || []).map((p: any) => ({
        ...p,
        imageUrl: p.image_url || p.imageUrl || 'https://placehold.co/400x500/101922/FFF?text=Sin+Imagen',
        thumbnails: p.images || p.thumbnails || [],
        costPrice: p.cost_price || p.costPrice,
        originalPrice: p.original_price || p.originalPrice,
        batteryHealth: p.battery_health || p.batteryHealth,
      }));
      setInventory(mappedData);
    }

    // 2. Fetch Fundas
    const { data: fundasData, error: fundasError } = await supabase.from('fundas').select('*').eq('is_active', true);
    if (fundasData) {
      const mappedFundas = fundasData.map((f: any) => ({
        id: f.id,
        name: f.name,
        price: f.price,
        originalPrice: 0,
        storage: 'N/A',
        color: f.color || 'N/A',
        condition: 'New', // Default for accessories
        batteryHealth: 'N/A',
        imageUrl: (f.thumbnails && f.thumbnails[0]) || 'https://placehold.co/400x500?text=Funda',
        thumbnails: f.thumbnails || [],
        specs: [
          { label: 'Marca', value: f.brand || 'Genérica' },
          { label: 'Material', value: f.material || 'N/A' },
          { label: 'Compatible', value: (f.compatible_models || []).join(', ') }
        ]
      }));
      setCases(mappedFundas);
    }

    // 3. Fetch Accesorios
    const { data: accData, error: accError } = await supabase.from('accesorios').select('*').eq('is_active', true);
    if (accData) {
      const mappedAcc = accData.map((a: any) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        originalPrice: 0,
        storage: 'N/A', // Not applicable
        color: 'N/A',
        condition: 'New',
        batteryHealth: 'N/A',
        imageUrl: (a.thumbnails && a.thumbnails[0]) || 'https://placehold.co/400x500?text=Accesorio',
        thumbnails: a.thumbnails || [],
        specs: [
          { label: 'Categoría', value: a.category },
          { label: 'Marca', value: a.brand || 'Genérica' }
        ]
      }));
      setAccessories(mappedAcc);
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
    await fetchInventory();

    setCart([]);
    setUseTradeIn(false);
  };

  const addInventoryItem = async (product: Product) => {
    const { id, ...rest } = product;

    // Map to snake_case for DB
    const dbPayload = {
      ...rest,
      image_url: product.imageUrl,
      cost_price: product.costPrice,
      original_price: product.originalPrice,
      battery_health: product.batteryHealth,
      // Ensure we don't send camelCase if DB is strict, but usually extra keys are ignored or we should omit them explicitly if needed.
      // For now, sending both is risky if DB has strict schema, but mapping ensures the snake_case keys exist.
      // Better to explicitly construct the object if we know the schema.
      // Let's assume strict snake_case is needed and create a clean object.
    };

    // Clean payload: remove camelCase versions to avoid DB errors if columns don't exist
    const { imageUrl, costPrice, originalPrice, batteryHealth, ...cleanRest } = rest;
    const finalPayload = {
      ...cleanRest,
      image_url: imageUrl,
      cost_price: costPrice,
      original_price: originalPrice,
      battery_health: batteryHealth
    };

    const { data, error } = await supabase.from('products').insert([finalPayload]).select().single();

    if (error) {
      console.error('Error adding product:', error);
    } else if (data) {
      // When we get data back, we need to map it back to camelCase for local state?
      // OR just re-fetch inventory. Re-fetching is safer for consistency.
      // But to be fast, we can just append the local product (with the new ID).
      // Actually, data returned from insert will be snake_case.
      const newProduct = {
        ...data,
        imageUrl: data.image_url,
        costPrice: data.cost_price,
        originalPrice: data.original_price,
        batteryHealth: data.battery_health,
      };
      setInventory(prev => [newProduct, ...prev]);
    }
  };

  const updateInventoryItem = async (product: Product) => {
    // Clean payload and map to snake_case
    const { id, imageUrl, costPrice, originalPrice, batteryHealth, ...rest } = product;
    const finalPayload = {
      ...rest,
      image_url: imageUrl,
      cost_price: costPrice,
      original_price: originalPrice,
      battery_health: batteryHealth
    };

    const { error } = await supabase.from('products').update(finalPayload).eq('id', product.id);

    if (error) {
      console.error('Error updating product:', error);
    } else {
      setInventory(prev => prev.map(item => item.id === product.id ? product : item));
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
      inventory, cases, accessories, cart, savedIds, user, session, authLoading,
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

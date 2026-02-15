// AppContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../services/db";

// ======================================================
// Types (mantenidos simples para no romper tu build)
// ======================================================

export type Category = "phones" | "cases" | "accessories";

export type ProductStatus = "pedido" | "en_taller" | "disponible" | "sold";

export type LedgerType = "bonus" | "profit";

export type UserRole = "admin" | "client" | null;

export type Tier =
  | "none"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

type UUID = string;

export interface Partner {
  id: UUID;
  name: string;
  is_active: boolean;
  profit_percent: number; // 46 / 46 / 8 etc.
  // Si tenés otra columna para identificar “empleado” sin profit:
  // is_profit_eligible?: boolean;
}

export interface PartnerLedgerRow {
  id?: UUID;
  partner_id: UUID;
  type: LedgerType;
  amount_usd: number;
  note: string;
  created_at?: string;

  // Opcional recomendado para idempotencia:
  action_id?: string; // unique per operation to avoid duplicates
}

export interface SettingsRow {
  id?: UUID;
  key: string; // e.g. 'liquidity'
  value_json: any; // stored JSON in DB
  updated_at?: string;
}

export interface ProfileRow {
  id: UUID; // same as auth.user.id (usually)
  role: UserRole;
  tier?: Tier | null;
  points?: number | null;
}

export interface PurchaseRow {
  id?: UUID;
  created_at?: string;

  // Ajustar a tu schema real
  user_id?: UUID | null;
  category: Category;
  item_id: UUID;
  price_usd: number;

  // opcional:
  note?: string | null;
}

export interface PhoneRow {
  id: UUID;
  created_at?: string;

  // Ajustar columnas reales de products (phones)
  name?: string | null;
  model?: string | null;
  color?: string | null;
  storage?: string | null;

  status: ProductStatus;
  price: number; // USD
  cost_price: number; // USD final cost (base + courier + battery + extras + work)
  // si guardás breakdown:
  cost_base?: number | null;
  courier?: number | null;
  battery?: number | null;
  extras?: number | null;

  work_fede?: boolean | null;
  work_fabri?: boolean | null;
  work_feli?: boolean | null;

  // opcional:
  sold_at?: string | null;
}

export interface CaseRow {
  id: UUID;
  created_at?: string;

  // Ajustar columnas reales de fundas
  name?: string | null;
  model?: string | null; // compat
  variant?: string | null;

  price: number; // USD
  cost_price?: number | null; // si tenés costo
  stock?: number | null;

  // opcional:
  status?: "available" | "sold_out" | null;
}

export interface AccessoryRow {
  id: UUID;
  created_at?: string;

  // Ajustar columnas reales de accesorios
  name?: string | null;
  category?: string | null;

  price: number; // USD
  cost_price?: number | null;
  stock?: number | null;
}

// ======================================================
// Context interface (incluye todo lo que nombraste)
// ======================================================

export interface AppContextType {
  // -------------------------
  // State
  // -------------------------
  inventory: PhoneRow[];
  cases: CaseRow[];
  accessories: AccessoryRow[];

  businessLiquidity: number;

  userRole: UserRole;
  userTier: Tier;
  userPoints: number;

  activeCategory: Category;
  setActiveCategory: (c: Category) => void;

  // -------------------------
  // Loading / Errors
  // -------------------------
  isBootstrapping: boolean;
  isBusy: boolean;
  lastError: string | null;
  clearError: () => void;

  // -------------------------
  // Fetch
  // -------------------------
  reloadAll: () => Promise<void>;
  reloadCategory: (category: Category) => Promise<void>;
  reloadLiquidity: () => Promise<void>;
  reloadProfile: () => Promise<void>;

  // -------------------------
  // CRUD (category-based)
  // -------------------------
  createItem: (category: Category, data: any) => Promise<void>;
  updateItem: (category: Category, id: UUID, patch: any) => Promise<void>;
  deleteItem: (category: Category, id: UUID) => Promise<void>;

  // -------------------------
  // Legacy named functions (para no romper tu app)
  // Phones
  addInventoryItem: (data: Partial<PhoneRow>) => Promise<void>;
  updateInventoryItem: (id: UUID, patch: Partial<PhoneRow>) => Promise<void>;
  deleteInventoryItem: (id: UUID) => Promise<void>;

  // Cases
  addCaseItem: (data: Partial<CaseRow>) => Promise<void>;
  updateCaseItem: (id: UUID, patch: Partial<CaseRow>) => Promise<void>;
  deleteCaseItem: (id: UUID) => Promise<void>;

  // Accessories
  addAccessoryItem: (data: Partial<AccessoryRow>) => Promise<void>;
  updateAccessoryItem: (id: UUID, patch: Partial<AccessoryRow>) => Promise<void>;
  deleteAccessoryItem: (id: UUID) => Promise<void>;

  // -------------------------
  // Business logic
  // -------------------------

  // 1) Work bonus buttons (adds $40 and ledger record)
  addWorkBonus: (args: {
    phoneId: UUID;
    partnerName: "Fede" | "Fabri" | "Feli";
    amountUsd?: number; // default 40
  }) => Promise<void>;

  // 2) Mark phone as sold (profit split + ledger + liquidity increment)
  sellPhone: (args: {
    phoneId: UUID;
    soldPriceUsd?: number; // if omitted, uses phone.price
    note?: string;
  }) => Promise<void>;

  // 3) Manual liquidity edit (admin)
  setLiquidityManual: (newLiquidityUsd: number) => Promise<void>;

  // -------------------------
  // Purchases / points / memberships
  // -------------------------
  confirmPurchase: (args: {
    category: Category;
    itemId: UUID;
    priceUsd: number;
    note?: string;
  }) => Promise<void>;

  incrementPoints: (points: number) => Promise<void>; // RPC optional
  setTier: (tier: Tier) => Promise<void>; // optional

  // -------------------------
  // Trade-in helpers
  // -------------------------
  calculateTradeInValue: (args: {
    devicePriceUsd: number;
    batteryHealth?: number; // 0-100
    condition?: "excellent" | "good" | "fair" | "poor";
    cycles?: number;
  }) => number;

  calculateDowngradeCash: (args: {
    newDevicePriceUsd: number;
    tradeInValueUsd: number;
    cashAvailableUsd: number;
  }) => { cashNeededUsd: number; isEnough: boolean };
}

// ======================================================
// Table mapping (NO unificación, 3 tablas)
// ======================================================

const TABLE_MAP: Record<Category, string> = {
  phones: "products",
  cases: "fundas",
  accessories: "accesorios",
};

// settings: key='liquidity' with JSON
const SETTINGS_TABLE = "settings";
const LEDGER_TABLE = "partner_ledger";
const PARTNERS_TABLE = "partners";
const PROFILES_TABLE = "profiles";
const PURCHASES_TABLE = "purchases";

// Settings key used:
const LIQUIDITY_KEY = "liquidity";

// ======================================================
// Helpers
// ======================================================

function toNumberSafe(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function makeActionId(prefix: string): string {
  // lightweight unique id (good enough client-side).
  // If querés id fuerte, usá crypto.randomUUID() (en browsers modernos).
  const rnd = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${rnd}`;
}

function normalizeTier(t?: Tier | null): Tier {
  return (t ?? "none") as Tier;
}

// ======================================================
// Context
// ======================================================

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // -------------------------
  // Core state
  // -------------------------
  const [inventory, setInventory] = useState<PhoneRow[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [accessories, setAccessories] = useState<AccessoryRow[]>([]);

  const [businessLiquidity, setBusinessLiquidity] = useState<number>(0);

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userTier, setUserTierState] = useState<Tier>("none");
  const [userPoints, setUserPoints] = useState<number>(0);

  const [activeCategory, setActiveCategory] = useState<Category>("phones");

  // -------------------------
  // UI/ops state
  // -------------------------
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const clearError = useCallback(() => setLastError(null), []);

  // Prevent double-execution in StrictMode / repeated bootstraps
  const bootRef = useRef(false);

  // A tiny per-operation lock to avoid double submit duplicates
  const busyRef = useRef(false);

  const withBusy = useCallback(async <T,>(fn: () => Promise<T>) => {
    if (busyRef.current) {
      // If you prefer: throw new Error("Busy");
      return;
    }
    busyRef.current = true;
    setIsBusy(true);
    setLastError(null);
    try {
      return await fn();
    } catch (e: any) {
      const msg =
        e?.message ||
        e?.error_description ||
        e?.details ||
        "Ocurrió un error";
      console.error("AppContext error:", e);
      setLastError(msg);
      throw e;
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, []);

  // -------------------------
  // Low-level fetchers
  // -------------------------

  const reloadCategory = useCallback(async (category: Category) => {
    const table = TABLE_MAP[category];

    // Optional ordering: most recent first
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (category === "phones") setInventory((data as any[]) as PhoneRow[]);
    if (category === "cases") setCases((data as any[]) as CaseRow[]);
    if (category === "accessories")
      setAccessories((data as any[]) as AccessoryRow[]);
  }, []);

  const reloadLiquidity = useCallback(async () => {
    // settings row with key=liquidity, value_json like { usd: 123 }
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("key", LIQUIDITY_KEY)
      .maybeSingle();

    if (error) throw error;

    const valueJson = (data as any)?.value_json;
    const usd = toNumberSafe(valueJson?.usd, 0);
    setBusinessLiquidity(usd);
  }, []);

  const reloadProfile = useCallback(async () => {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) throw authErr;

    if (!user) {
      setUserRole(null);
      setUserTierState("none");
      setUserPoints(0);
      return;
    }

    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    const role = (data as any)?.role ?? null;
    const tier = normalizeTier((data as any)?.tier ?? "none");
    const points = toNumberSafe((data as any)?.points, 0);

    setUserRole(role);
    setUserTierState(tier);
    setUserPoints(points);
  }, []);

  const reloadAll = useCallback(async () => {
    await Promise.all([
      reloadCategory("phones"),
      reloadCategory("cases"),
      reloadCategory("accessories"),
      reloadLiquidity(),
      reloadProfile(),
    ]);
  }, [reloadCategory, reloadLiquidity, reloadProfile]);

  // -------------------------
  // Generic CRUD (category-based)
  // -------------------------

  const createItem = useCallback(
    async (category: Category, data: any) => {
      const table = TABLE_MAP[category];
      // Normalización mínima por seguridad:
      // - Forzá numbers cuando haga falta
      // - Forzá status en phones si no viene
      const payload = { ...data };

      if (category === "phones") {
        if (!payload.status) payload.status = "disponible";
        if (payload.price != null) payload.price = toNumberSafe(payload.price);
        if (payload.cost_price != null)
          payload.cost_price = toNumberSafe(payload.cost_price);
      } else {
        if (payload.price != null) payload.price = toNumberSafe(payload.price);
        if (payload.cost_price != null)
          payload.cost_price = toNumberSafe(payload.cost_price);
        if (payload.stock != null) payload.stock = toNumberSafe(payload.stock);
      }

      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;

      await reloadCategory(category);
    },
    [reloadCategory]
  );

  const updateItem = useCallback(
    async (category: Category, id: UUID, patch: any) => {
      const table = TABLE_MAP[category];
      const payload = { ...patch };

      if (category === "phones") {
        if (payload.price != null) payload.price = toNumberSafe(payload.price);
        if (payload.cost_price != null)
          payload.cost_price = toNumberSafe(payload.cost_price);
        if (payload.courier != null) payload.courier = toNumberSafe(payload.courier);
        if (payload.battery != null) payload.battery = toNumberSafe(payload.battery);
        if (payload.extras != null) payload.extras = toNumberSafe(payload.extras);
        if (payload.cost_base != null)
          payload.cost_base = toNumberSafe(payload.cost_base);
      } else {
        if (payload.price != null) payload.price = toNumberSafe(payload.price);
        if (payload.cost_price != null)
          payload.cost_price = toNumberSafe(payload.cost_price);
        if (payload.stock != null) payload.stock = toNumberSafe(payload.stock);
      }

      const { error } = await supabase.from(table).update(payload).eq("id", id);
      if (error) throw error;

      await reloadCategory(category);
    },
    [reloadCategory]
  );

  const deleteItem = useCallback(
    async (category: Category, id: UUID) => {
      const table = TABLE_MAP[category];
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;

      await reloadCategory(category);
    },
    [reloadCategory]
  );

  // -------------------------
  // Legacy named wrappers
  // (para que no rompas imports existentes)
  // -------------------------

  const addInventoryItem = useCallback(
    async (data: Partial<PhoneRow>) => createItem("phones", data),
    [createItem]
  );
  const updateInventoryItem = useCallback(
    async (id: UUID, patch: Partial<PhoneRow>) => updateItem("phones", id, patch),
    [updateItem]
  );
  const deleteInventoryItem = useCallback(
    async (id: UUID) => deleteItem("phones", id),
    [deleteItem]
  );

  const addCaseItem = useCallback(
    async (data: Partial<CaseRow>) => createItem("cases", data),
    [createItem]
  );
  const updateCaseItem = useCallback(
    async (id: UUID, patch: Partial<CaseRow>) => updateItem("cases", id, patch),
    [updateItem]
  );
  const deleteCaseItem = useCallback(
    async (id: UUID) => deleteItem("cases", id),
    [deleteItem]
  );

  const addAccessoryItem = useCallback(
    async (data: Partial<AccessoryRow>) => createItem("accessories", data),
    [createItem]
  );
  const updateAccessoryItem = useCallback(
    async (id: UUID, patch: Partial<AccessoryRow>) =>
      updateItem("accessories", id, patch),
    [updateItem]
  );
  const deleteAccessoryItem = useCallback(
    async (id: UUID) => deleteItem("accessories", id),
    [deleteItem]
  );

  // -------------------------
  // Liquidity setters
  // -------------------------

  const setLiquidityManual = useCallback(async (newLiquidityUsd: number) => {
    const usd = toNumberSafe(newLiquidityUsd, 0);

    // Upsert settings row key='liquidity'
    // OJO: Para que upsert funcione bien, en DB key debería ser UNIQUE.
    const payload = {
      key: LIQUIDITY_KEY,
      value_json: { usd },
    };

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(payload, { onConflict: "key" });

    if (error) throw error;

    setBusinessLiquidity(usd);
  }, []);

  const incrementLiquidity = useCallback(
    async (deltaUsd: number) => {
      const delta = toNumberSafe(deltaUsd, 0);
      const next = businessLiquidity + delta;
      await setLiquidityManual(next);
    },
    [businessLiquidity, setLiquidityManual]
  );

  // -------------------------
  // Partners / Ledger helpers
  // -------------------------

  const fetchActivePartners = useCallback(async (): Promise<Partner[]> => {
    const { data, error } = await supabase
      .from(PARTNERS_TABLE)
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return (data as any[]) as Partner[];
  }, []);

  const insertLedgerRow = useCallback(async (row: PartnerLedgerRow) => {
    const { error } = await supabase.from(LEDGER_TABLE).insert(row);
    if (error) throw error;
  }, []);

  // -------------------------
  // Work Bonus ($40) logic
  // -------------------------

  const addWorkBonus = useCallback(
    async (args: {
      phoneId: UUID;
      partnerName: "Fede" | "Fabri" | "Feli";
      amountUsd?: number;
    }) => {
      await withBusy(async () => {
        const amount = toNumberSafe(args.amountUsd ?? 40, 40);

        // 1) Find partner
        const { data: partnersData, error: partnersErr } = await supabase
          .from(PARTNERS_TABLE)
          .select("*")
          .eq("is_active", true);

        if (partnersErr) throw partnersErr;

        const partners = (partnersData as any[]) as Partner[];
        const partner = partners.find(
          (p) => p.name?.toLowerCase() === args.partnerName.toLowerCase()
        );

        if (!partner) {
          throw new Error(
            `No se encontró partner activo para: ${args.partnerName}`
          );
        }

        // 2) Fetch phone name/model for note
        const { data: phoneData, error: phoneErr } = await supabase
          .from(TABLE_MAP.phones)
          .select("*")
          .eq("id", args.phoneId)
          .single();

        if (phoneErr) throw phoneErr;
        const phone = phoneData as any as PhoneRow;

        const phoneLabel =
          phone?.name ||
          phone?.model ||
          `ID ${String(args.phoneId).slice(0, 6)}`;

        const note = `Reacondicionamiento ${phoneLabel}`;

        // 3) Optional: set work flag to prevent duplicates
        // Ajustá estos nombres si tus columnas son otras:
        const flagField =
          args.partnerName === "Fede"
            ? "work_fede"
            : args.partnerName === "Fabri"
              ? "work_fabri"
              : "work_feli";

        // Si ya estaba marcado, frenamos para evitar doble bonus:
        if ((phone as any)?.[flagField] === true) {
          // idempotencia simple
          return;
        }

        // 4) Update phone flag + (opcional) aumentar cost_price si lo usás así
        // Ojo: vos dijiste que los botones work agregan 40 al costo final.
        // Entonces: cost_price += 40
        const newCostPrice = toNumberSafe(phone.cost_price, 0) + amount;

        const { error: updErr } = await supabase
          .from(TABLE_MAP.phones)
          .update({
            [flagField]: true,
            cost_price: newCostPrice,
          })
          .eq("id", args.phoneId);

        if (updErr) throw updErr;

        // 5) Insert ledger bonus (append-only)
        const actionId = makeActionId(`bonus_${args.phoneId}_${partner.id}`);

        await insertLedgerRow({
          partner_id: partner.id,
          type: "bonus",
          amount_usd: amount,
          note,
          action_id: actionId,
        });

        // 6) Refresh phones
        await reloadCategory("phones");
      });
    },
    [insertLedgerRow, reloadCategory, withBusy]
  );

  // -------------------------
  // Sell phone logic
  // -------------------------

  const sellPhone = useCallback(
    async (args: { phoneId: UUID; soldPriceUsd?: number; note?: string }) => {
      await withBusy(async () => {
        // 1) Fetch phone
        const { data: phoneData, error: phoneErr } = await supabase
          .from(TABLE_MAP.phones)
          .select("*")
          .eq("id", args.phoneId)
          .single();

        if (phoneErr) throw phoneErr;

        const phone = phoneData as any as PhoneRow;

        if (phone.status === "sold") {
          // idempotencia
          return;
        }

        const soldPrice = toNumberSafe(args.soldPriceUsd ?? phone.price, 0);
        const cost = toNumberSafe(phone.cost_price, 0);
        const profit = soldPrice - cost;

        // 2) partners activos (solo profit-eligible)
        const partners = await fetchActivePartners();

        // Si tenés empleados que NO participan de profit, filtralos acá:
        // const profitPartners = partners.filter(p => p.is_profit_eligible !== false);
        // Si no tenés columna, asumimos que % define si participa:
        const profitPartners = partners.filter(
          (p) => toNumberSafe(p.profit_percent, 0) > 0
        );

        // Si profit es negativo, igual podrías registrar loss o no registrar nada.
        // Acá: si profit <= 0, no distribuye profit, pero igual marca sold y liquidez suma el precio.
        const shouldDistribute = profit > 0 && profitPartners.length > 0;

        // 3) Create ledger rows
        const baseNote =
          args.note ??
          `Ganancia venta ${phone?.name || phone?.model || String(phone.id).slice(0, 6)
          }`;

        if (shouldDistribute) {
          // percent-based split
          for (const p of profitPartners) {
            const pct = toNumberSafe(p.profit_percent, 0);
            const amount = (profit * pct) / 100;

            // Evitar basura tipo 0.0000001
            const amountRounded = Math.round(amount * 100) / 100;

            if (amountRounded <= 0) continue;

            const actionId = makeActionId(
              `profit_${args.phoneId}_${p.id}`
            );

            await insertLedgerRow({
              partner_id: p.id,
              type: "profit",
              amount_usd: amountRounded,
              note: baseNote,
              action_id: actionId,
            });
          }
        }

        // 4) Update phone status sold + sold_at + price if passed
        const { error: updErr } = await supabase
          .from(TABLE_MAP.phones)
          .update({
            status: "sold",
            sold_at: new Date().toISOString(),
            price: soldPrice, // guardamos precio final usado
          })
          .eq("id", args.phoneId);

        if (updErr) throw updErr;

        // 5) Increment liquidity by sold price
        await incrementLiquidity(soldPrice);

        // 6) Refresh
        await reloadCategory("phones");
        await reloadLiquidity();
      });
    },
    [
      fetchActivePartners,
      incrementLiquidity,
      insertLedgerRow,
      reloadCategory,
      reloadLiquidity,
      withBusy,
    ]
  );

  // -------------------------
  // Purchases & Points / Tier
  // -------------------------

  const incrementPoints = useCallback(
    async (points: number) => {
      await withBusy(async () => {
        const add = toNumberSafe(points, 0);
        if (add === 0) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("No hay usuario logueado");

        // If you have RPC:
        // const { error } = await supabase.rpc("increment_points", { p_user_id: user.id, p_points: add });
        // if (error) throw error;

        // fallback: direct update profiles.points
        const nextPoints = userPoints + add;

        const { error } = await supabase
          .from(PROFILES_TABLE)
          .update({ points: nextPoints })
          .eq("id", user.id);

        if (error) throw error;

        setUserPoints(nextPoints);
      });
    },
    [userPoints, withBusy]
  );

  const setTier = useCallback(
    async (tier: Tier) => {
      await withBusy(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("No hay usuario logueado");

        const { error } = await supabase
          .from(PROFILES_TABLE)
          .update({ tier })
          .eq("id", user.id);

        if (error) throw error;

        setUserTierState(tier);
      });
    },
    [withBusy]
  );

  const confirmPurchase = useCallback(
    async (args: {
      category: Category;
      itemId: UUID;
      priceUsd: number;
      note?: string;
    }) => {
      await withBusy(async () => {
        const price = toNumberSafe(args.priceUsd, 0);
        if (price <= 0) throw new Error("Precio inválido");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const row: PurchaseRow = {
          category: args.category,
          item_id: args.itemId,
          price_usd: price,
          note: args.note ?? null,
          user_id: user?.id ?? null,
        };

        const { error } = await supabase.from(PURCHASES_TABLE).insert(row);
        if (error) throw error;

        // Si querés otorgar puntos por compra:
        // ejemplo: 1 punto por USD
        await incrementPoints(Math.floor(price));
      });
    },
    [incrementPoints, withBusy]
  );

  // -------------------------
  // Trade-in helpers (simple, ajustable)
  // -------------------------

  const calculateTradeInValue = useCallback(
    (args: {
      devicePriceUsd: number;
      batteryHealth?: number;
      condition?: "excellent" | "good" | "fair" | "poor";
      cycles?: number;
    }) => {
      const base = toNumberSafe(args.devicePriceUsd, 0);
      if (base <= 0) return 0;

      // Base trade-in: 60% del valor (ajustalo)
      let value = base * 0.6;

      const bh = args.batteryHealth ?? 100;
      const condition = args.condition ?? "good";
      const cycles = args.cycles ?? 0;

      // Battery health penalty
      if (bh < 90) value -= base * 0.03;
      if (bh < 85) value -= base * 0.03;
      if (bh < 80) value -= base * 0.05;

      // Condition factor
      const condFactor =
        condition === "excellent"
          ? 1.05
          : condition === "good"
            ? 1
            : condition === "fair"
              ? 0.9
              : 0.8;

      value *= condFactor;

      // Cycles penalty (muy suave)
      if (cycles > 500) value -= base * 0.02;
      if (cycles > 800) value -= base * 0.03;

      // Floor
      value = Math.max(0, value);

      // Round
      return Math.round(value * 100) / 100;
    },
    []
  );

  const calculateDowngradeCash = useCallback(
    (args: {
      newDevicePriceUsd: number;
      tradeInValueUsd: number;
      cashAvailableUsd: number;
    }) => {
      const newPrice = toNumberSafe(args.newDevicePriceUsd, 0);
      const trade = toNumberSafe(args.tradeInValueUsd, 0);
      const cash = toNumberSafe(args.cashAvailableUsd, 0);

      const cashNeededUsd = Math.max(0, newPrice - trade);
      return { cashNeededUsd, isEnough: cash >= cashNeededUsd };
    },
    []
  );

  // -------------------------
  // Bootstrap
  // -------------------------

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    (async () => {
      setIsBootstrapping(true);
      try {
        await reloadAll();

        // Also: keep profile updated on auth changes
        supabase.auth.onAuthStateChange(async () => {
          try {
            await reloadProfile();
          } catch (e) {
            console.error(e);
          }
        });
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.error_description ||
          e?.details ||
          "Error al inicializar";
        setLastError(msg);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [reloadAll, reloadProfile]);

  // -------------------------
  // Value memo
  // -------------------------

  const value: AppContextType = useMemo(
    () => ({
      // State
      inventory,
      cases,
      accessories,
      businessLiquidity,

      userRole,
      userTier,
      userPoints,

      activeCategory,
      setActiveCategory,

      // Loading / Errors
      isBootstrapping,
      isBusy,
      lastError,
      clearError,

      // Fetch
      reloadAll,
      reloadCategory,
      reloadLiquidity,
      reloadProfile,

      // CRUD
      createItem,
      updateItem,
      deleteItem,

      // Legacy functions
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,

      addCaseItem,
      updateCaseItem,
      deleteCaseItem,

      addAccessoryItem,
      updateAccessoryItem,
      deleteAccessoryItem,

      // Business logic
      addWorkBonus,
      sellPhone,
      setLiquidityManual,

      // Purchases / points / tier
      confirmPurchase,
      incrementPoints,
      setTier,

      // Trade-in
      calculateTradeInValue,
      calculateDowngradeCash,
    }),
    [
      inventory,
      cases,
      accessories,
      businessLiquidity,
      userRole,
      userTier,
      userPoints,
      activeCategory,
      isBootstrapping,
      isBusy,
      lastError,
      clearError,
      reloadAll,
      reloadCategory,
      reloadLiquidity,
      reloadProfile,
      createItem,
      updateItem,
      deleteItem,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addCaseItem,
      updateCaseItem,
      deleteCaseItem,
      addAccessoryItem,
      updateAccessoryItem,
      deleteAccessoryItem,
      addWorkBonus,
      sellPhone,
      setLiquidityManual,
      confirmPurchase,
      incrementPoints,
      setTier,
      calculateTradeInValue,
      calculateDowngradeCash,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ======================================================
// Hook
// ======================================================

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider />");
  return ctx;
}

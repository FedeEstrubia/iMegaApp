
export enum DeviceCondition {
  NEW = 'Nuevo',
  EXCELLENT = 'Excelente',
  GOOD = 'Buen estado',
  REFURBISHED = 'Reacondicionado'
}

export type UserRole = 'admin' | 'client';
export type MembershipTier = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

export interface Product {
  id: string;
  name: string;
  storage: string;
  color: string;
  price: number; // Precio de venta final
  costPrice: number; // Precio de costo
  originalPrice?: number;
  condition: DeviceCondition;
  batteryHealth: string;
  imageUrl: string;
  thumbnails: string[];
  description: string;
  specs: {
    label: string;
    value: string;
    icon: string;
  }[];
}

export interface PurchasedDevice {
  model: string;
  storage: string;
  color: string;
  purchaseDate: string; // ISO string
  purchasePrice: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface RewardHistory {
  id: string;
  title: string;
  date: string;
  points: number;
  icon: string;
}

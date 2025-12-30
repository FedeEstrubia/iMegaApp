
import { DeviceCondition, Product, RewardHistory } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '15-pro-max',
    name: 'iPhone 15 Pro Max',
    storage: '256GB',
    color: 'Titanio Natural',
    price: 1199,
    costPrice: 950,
    originalPrice: 1299,
    condition: DeviceCondition.NEW,
    batteryHealth: '100%',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0Z3Rrp47J29uMgPV71sXlBH6AUBWDvL6Qa6vSGDR7t337qhVdIVH7RjFajlkhzCrMTBbOjx42HxHseL2rQW5yA7bQWUG22X_K77D3Y4TAPk22vsrB2W6xvz8u67BX6OU61Wy0lSZivEmSWhcaUEkyu-swDVwU42X2Pf7MC6YIxFMb0ho1RuFXTmRKmiktQ1jSFLPo4OHVlBo6_d06c2qc8PORDJY1I9cscuJETz76q4IMhUyCWytH2LiKBByeIGYhvjWUi62uHiY',
    thumbnails: [],
    description: 'Diseño de titanio. Chip A17 Pro. El iPhone más potente de la historia.',
    specs: [
      { label: 'Salud Batería', value: '100% Capacidad', icon: 'battery_full' },
      { label: 'Estado', value: 'Como Nuevo', icon: 'stars' },
      { label: 'Garantía', value: '12 Meses', icon: 'security' },
      { label: 'Caja', value: 'Caja Original', icon: 'cable' }
    ]
  },
  {
    id: '14-plus',
    name: 'iPhone 14 Plus',
    storage: '128GB',
    color: 'Azul',
    price: 650,
    costPrice: 500,
    originalPrice: 799,
    condition: DeviceCondition.EXCELLENT,
    batteryHealth: '92%',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA99EhC1_CBUERpmkwJgK6fM2hB7js5Zy2NEGDRVTJ0rw8FcW4JGHHz0fQH1q461UZsZDujcYYNkVj5lSOwWPZFdAwLjqnRsf5cbsR7HFnGSfqafYFXI65r1mYbC2wlwYZ6oIbenmduXD1ii_ysJUfL-hSvx9teHlfK8BC14sIqazi1UQpsqzOLj40QqxxRpS6dAz7_JjAnen_MkAAcsq5vwz_jIcSssJ5ZLqgUDgrwXqFySfE6oku0k2lCyzxlDERo0D1AdBl1x3I',
    thumbnails: [],
    description: 'Pantalla grande, increíble duración de batería.',
    specs: [
      { label: 'Salud Batería', value: '92% Capacidad', icon: 'battery_full' },
      { label: 'Estado', value: 'Excelente', icon: 'stars' },
      { label: 'Garantía', value: '6 Meses', icon: 'security' },
      { label: 'Caja', value: 'Caja Genérica', icon: 'cable' }
    ]
  }
];

export const REWARD_HISTORY: RewardHistory[] = [
  { id: '1', title: 'Compra Nike Air Max', date: 'Hoy, 2:30 PM', points: 120, icon: 'shopping_bag' },
  { id: '2', title: 'Bono Semanal', date: 'Ayer', points: 50, icon: 'celebration' },
  { id: '3', title: 'Creación de Cuenta', date: 'Hace 2 días', points: 200, icon: 'person_add' }
];

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  image?: string;
  role: UserRole;
  businessId?: string;
  staffId?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STAFF';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Business Types
export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  timezone: string;
  currency: string;
  operatingHours?: OperatingHours;
  settings?: BusinessSettings;
  createdAt: string;
  updatedAt: string;
}

export type BusinessType =
  | 'HAIR_SALON'
  | 'BARBERSHOP'
  | 'NAIL_SALON'
  | 'SPA'
  | 'MASSAGE'
  | 'LASH_BROW'
  | 'WAXING'
  | 'MAKEUP'
  | 'WELLNESS'
  | 'MULTI_SERVICE';

export interface OperatingHours {
  [key: string]: {
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  };
}

export interface BusinessSettings {
  appointmentBuffer?: number;
  cancellationPolicy?: string;
  depositRequired?: boolean;
  depositAmount?: number;
}

// Client Types
export interface Client {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: Gender;
  notes?: string;
  preferences?: ClientPreferences;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export interface ClientPreferences {
  preferredStaffId?: string;
  preferredServices?: string[];
  allergies?: string[];
  notes?: string;
}

// Staff Types
export interface Staff {
  id: string;
  userId: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  title?: string;
  bio?: string;
  employmentType: EmploymentType;
  compensationType: CompensationType;
  hourlyRate?: number;
  commissionRate?: number;
  isActive: boolean;
  services?: Service[];
  workingHours?: WorkingHours;
  createdAt: string;
  updatedAt: string;
}

export type EmploymentType = 'EMPLOYEE' | 'BOOTH_RENTER' | 'CONTRACTOR';
export type CompensationType = 'HOURLY' | 'COMMISSION' | 'SALARY' | 'HYBRID';

export interface WorkingHours {
  [key: string]: {
    isWorking: boolean;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

// Service Types
export interface Service {
  id: string;
  businessId: string;
  categoryId?: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  pricingType: PricingType;
  depositAmount?: number;
  bufferTime?: number;
  isActive: boolean;
  category?: ServiceCategory;
  createdAt: string;
  updatedAt: string;
}

export type PricingType = 'FIXED' | 'STARTING_AT' | 'VARIABLE' | 'CONSULTATION';

export interface ServiceCategory {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

// Appointment Types
export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  source: BookingSource;
  notes?: string;
  internalNotes?: string;
  depositPaid: number;
  totalPrice: number;
  client?: Client;
  staff?: Staff;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'BOOKED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type BookingSource =
  | 'PHONE'
  | 'WALK_IN'
  | 'ONLINE'
  | 'APP'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'REFERRAL'
  | 'KIOSK'
  | 'AI_VOICE'
  | 'MARKETPLACE';

// Transaction Types
export interface Transaction {
  id: string;
  businessId: string;
  clientId?: string;
  staffId?: string;
  appointmentId?: string;
  type: TransactionType;
  status: TransactionStatus;
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  items: TransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'SALE' | 'REFUND' | 'VOID' | 'ADJUSTMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'GIFT_CARD' | 'POINTS' | 'SPLIT';

export interface TransactionItem {
  id: string;
  transactionId: string;
  type: 'SERVICE' | 'PRODUCT' | 'GIFT_CARD';
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Product Types
export interface Product {
  id: string;
  businessId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  newClients: number;
  upcomingAppointments: Appointment[];
  recentTransactions: Transaction[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Navigation Types
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'appointment/[id]': { id: string };
  'client/[id]': { id: string };
  'booking/new': { clientId?: string };
  'checkout': { appointmentId?: string };
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
};

export type TabsParamList = {
  index: undefined;
  appointments: undefined;
  clients: undefined;
  pos: undefined;
  settings: undefined;
};

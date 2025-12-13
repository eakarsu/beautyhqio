// Re-export Prisma types
export type {
  Business,
  Location,
  User,
  Staff,
  StaffSchedule,
  TimeOff,
  Client,
  ClientPhoto,
  ServiceFormula,
  ClientPreference,
  Activity,
  ClientNote,
  Attachment,
  ServiceCategory,
  Service,
  ServiceAddOn,
  Appointment,
  AppointmentService,
  AppointmentAddOn,
  WaitlistEntry,
  Transaction,
  TransactionLineItem,
  TransactionPayment,
  Tip,
  Commission,
  ProductCategory,
  Product,
  LoyaltyProgram,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  GiftCard,
  GiftCardUsage,
  Referral,
  Campaign,
  Review,
  Communication,
  Automation,
  AuditLog,
  SavedFilter,
} from "@prisma/client";

// Custom types
export interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  walkInQueue: number;
  staffOnDuty: number;
  lowInventoryCount: number;
  upcomingBirthdays: number;
  pendingReviews: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  staffId: string;
  staffName: string;
  staffColor: string;
  clientName: string;
  services: string[];
  status: string;
}

export interface CheckoutItem {
  id: string;
  type: "service" | "product";
  name: string;
  price: number;
  quantity: number;
  staffId?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
}

export interface BookingAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface NoShowPrediction {
  appointmentId: string;
  risk: number;
  factors: string[];
  recommendation: string;
}

export interface StyleRecommendation {
  id: string;
  name: string;
  image: string;
  description: string;
  confidence: number;
}

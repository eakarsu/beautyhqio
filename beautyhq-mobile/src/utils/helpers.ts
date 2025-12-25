import { format, parseISO, isToday, isTomorrow, isYesterday, differenceInMinutes } from 'date-fns';
import { AppointmentStatus, PaymentMethod } from '@/types';

// Date formatting helpers
export const formatDate = (date: string | Date, formatString = 'MMM d, yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatString);
};

export const formatTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'h:mm a');
};

export const formatDateTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMM d, yyyy h:mm a');
};

export const getRelativeDay = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(parsedDate)) return 'Today';
  if (isTomorrow(parsedDate)) return 'Tomorrow';
  if (isYesterday(parsedDate)) return 'Yesterday';

  return format(parsedDate, 'EEEE, MMM d');
};

export const getDuration = (startTime: string, endTime: string): string => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  const minutes = differenceInMinutes(end, start);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
};

// Currency formatting
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Phone formatting
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Name formatting
export const getInitials = (firstName: string, lastName?: string): string => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}`;
};

export const getFullName = (firstName: string, lastName?: string): string => {
  return lastName ? `${firstName} ${lastName}` : firstName;
};

// Status helpers
export const getStatusColor = (status: AppointmentStatus): string => {
  const statusColors: Record<AppointmentStatus, string> = {
    BOOKED: '#3B82F6',
    CONFIRMED: '#10B981',
    CHECKED_IN: '#8B5CF6',
    IN_SERVICE: '#F59E0B',
    COMPLETED: '#059669',
    CANCELLED: '#EF4444',
    NO_SHOW: '#DC2626',
    RESCHEDULED: '#6366F1',
  };
  return statusColors[status] || '#71717A';
};

export const getStatusLabel = (status: AppointmentStatus): string => {
  const statusLabels: Record<AppointmentStatus, string> = {
    BOOKED: 'Booked',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    IN_SERVICE: 'In Service',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
    RESCHEDULED: 'Rescheduled',
  };
  return statusLabels[status] || status;
};

// Payment method helpers
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    APPLE_PAY: 'Apple Pay',
    GOOGLE_PAY: 'Google Pay',
    GIFT_CARD: 'Gift Card',
    POINTS: 'Points',
    SPLIT: 'Split Payment',
  };
  return labels[method] || method;
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// String helpers
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Number helpers
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

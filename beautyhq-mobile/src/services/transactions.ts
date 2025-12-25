import api from './api';
import { Transaction, TransactionItem, PaymentMethod, ApiResponse, PaginatedResponse } from '@/types';

interface CreateTransactionRequest {
  clientId?: string;
  staffId?: string;
  appointmentId?: string;
  items: Array<{
    type: 'SERVICE' | 'PRODUCT' | 'GIFT_CARD';
    itemId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  paymentMethod: PaymentMethod;
  tip?: number;
  discount?: number;
  notes?: string;
}

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  clientId?: string;
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export const transactionsService = {
  async getTransactions(filters?: TransactionFilters): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return api.get<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`);
  },

  async getTransaction(id: string): Promise<ApiResponse<Transaction>> {
    return api.get<Transaction>(`/transactions/${id}`);
  },

  async getTodayTransactions(): Promise<ApiResponse<Transaction[]>> {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Transaction[]>(`/transactions?date=${today}`);
  },

  async createTransaction(data: CreateTransactionRequest): Promise<ApiResponse<Transaction>> {
    return api.post<Transaction>('/transactions', data);
  },

  async processPayment(
    transactionId: string,
    paymentMethod: PaymentMethod,
    paymentDetails?: Record<string, unknown>
  ): Promise<ApiResponse<Transaction>> {
    return api.post<Transaction>(`/transactions/${transactionId}/pay`, {
      paymentMethod,
      ...paymentDetails,
    });
  },

  async refundTransaction(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<ApiResponse<Transaction>> {
    return api.post<Transaction>(`/transactions/${transactionId}/refund`, {
      amount,
      reason,
    });
  },

  async voidTransaction(transactionId: string, reason?: string): Promise<ApiResponse<Transaction>> {
    return api.post<Transaction>(`/transactions/${transactionId}/void`, { reason });
  },

  async addTip(transactionId: string, amount: number): Promise<ApiResponse<Transaction>> {
    return api.post<Transaction>(`/transactions/${transactionId}/tip`, { amount });
  },

  async getDailySummary(date?: string): Promise<ApiResponse<{
    totalSales: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
    byPaymentMethod: Record<string, number>;
  }>> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    return api.get(`/transactions/summary?date=${queryDate}`);
  },
};

export default transactionsService;

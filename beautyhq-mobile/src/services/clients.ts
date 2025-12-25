import api from './api';
import { Client, Appointment, Transaction, ApiResponse, PaginatedResponse } from '@/types';

interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
}

interface UpdateClientRequest extends Partial<CreateClientRequest> {
  preferences?: Record<string, unknown>;
}

interface ClientFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const clientsService = {
  async getClients(filters?: ClientFilters): Promise<ApiResponse<PaginatedResponse<Client>>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return api.get<PaginatedResponse<Client>>(`/clients?${params.toString()}`);
  },

  async getClient(id: string): Promise<ApiResponse<Client>> {
    return api.get<Client>(`/clients/${id}`);
  },

  async searchClients(query: string): Promise<ApiResponse<Client[]>> {
    return api.get<Client[]>(`/clients/search?q=${encodeURIComponent(query)}`);
  },

  async createClient(data: CreateClientRequest): Promise<ApiResponse<Client>> {
    return api.post<Client>('/clients', data);
  },

  async updateClient(id: string, data: UpdateClientRequest): Promise<ApiResponse<Client>> {
    return api.patch<Client>(`/clients/${id}`, data);
  },

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/clients/${id}`);
  },

  async getClientAppointments(
    clientId: string,
    filters?: { status?: string; limit?: number }
  ): Promise<ApiResponse<Appointment[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));

    return api.get<Appointment[]>(`/clients/${clientId}/appointments?${params.toString()}`);
  },

  async getClientTransactions(
    clientId: string,
    filters?: { limit?: number }
  ): Promise<ApiResponse<Transaction[]>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', String(filters.limit));

    return api.get<Transaction[]>(`/clients/${clientId}/transactions?${params.toString()}`);
  },

  async getClientLoyaltyPoints(clientId: string): Promise<ApiResponse<{ points: number; history: unknown[] }>> {
    return api.get(`/clients/${clientId}/loyalty`);
  },

  async addLoyaltyPoints(
    clientId: string,
    points: number,
    reason: string
  ): Promise<ApiResponse<{ points: number }>> {
    return api.post(`/clients/${clientId}/loyalty/add`, { points, reason });
  },

  async redeemLoyaltyPoints(
    clientId: string,
    points: number,
    rewardId?: string
  ): Promise<ApiResponse<{ points: number }>> {
    return api.post(`/clients/${clientId}/loyalty/redeem`, { points, rewardId });
  },

  async getClientNotes(clientId: string): Promise<ApiResponse<unknown[]>> {
    return api.get(`/clients/${clientId}/notes`);
  },

  async addClientNote(clientId: string, content: string, isPinned = false): Promise<ApiResponse<unknown>> {
    return api.post(`/clients/${clientId}/notes`, { content, isPinned });
  },
};

export default clientsService;

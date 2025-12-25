import api from './api';
import { Service, ServiceCategory, ApiResponse } from '@/types';

export const servicesService = {
  async getServices(filters?: { categoryId?: string; isActive?: boolean }): Promise<ApiResponse<Service[]>> {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    return api.get<Service[]>(`/services?${params.toString()}`);
  },

  async getService(id: string): Promise<ApiResponse<Service>> {
    return api.get<Service>(`/services/${id}`);
  },

  async getCategories(): Promise<ApiResponse<ServiceCategory[]>> {
    return api.get<ServiceCategory[]>('/services/categories');
  },

  async getServicesByCategory(): Promise<ApiResponse<Record<string, Service[]>>> {
    return api.get<Record<string, Service[]>>('/services/by-category');
  },
};

export default servicesService;

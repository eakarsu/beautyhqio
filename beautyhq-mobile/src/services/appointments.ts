import api from './api';
import { Appointment, AppointmentStatus, ApiResponse, PaginatedResponse } from '@/types';

interface CreateAppointmentRequest {
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  notes?: string;
}

interface UpdateAppointmentRequest {
  staffId?: string;
  serviceId?: string;
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  internalNotes?: string;
}

interface AppointmentFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  staffId?: string;
  clientId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  page?: number;
  pageSize?: number;
}

export const appointmentsService = {
  async getAppointments(filters?: AppointmentFilters): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    return api.get<PaginatedResponse<Appointment>>(`/appointments?${params.toString()}`);
  },

  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return api.get<Appointment>(`/appointments/${id}`);
  },

  async getTodayAppointments(): Promise<ApiResponse<Appointment[]>> {
    const today = new Date().toISOString().split('T')[0];
    return api.get<Appointment[]>(`/appointments?date=${today}`);
  },

  async getUpcomingAppointments(limit = 10): Promise<ApiResponse<Appointment[]>> {
    return api.get<Appointment[]>(`/appointments/upcoming?limit=${limit}`);
  },

  async createAppointment(data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return api.post<Appointment>('/appointments', data);
  },

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}`, data);
  },

  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/cancel`, { reason });
  },

  async checkIn(id: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/check-in`);
  },

  async startService(id: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/start`);
  },

  async completeAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/complete`);
  },

  async reschedule(id: string, newStartTime: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/reschedule`, { startTime: newStartTime });
  },

  async markNoShow(id: string): Promise<ApiResponse<Appointment>> {
    return api.patch<Appointment>(`/appointments/${id}/no-show`);
  },

  async getAvailableSlots(
    staffId: string,
    serviceId: string,
    date: string
  ): Promise<ApiResponse<string[]>> {
    return api.get<string[]>(
      `/appointments/available-slots?staffId=${staffId}&serviceId=${serviceId}&date=${date}`
    );
  },
};

export default appointmentsService;

import axios from 'axios';
import { DATABASE_TYPES } from './types';
import { envUtils } from '../../lib/env';
import { offlineManager } from '../../lib/offline/OfflineManager';

const API_URL = envUtils.getApiBaseUrl();

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle authentication and FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors properly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message from backend response
    if (error.response?.data?.message) {
      // Create a new error with the backend message
      const backendError = new Error(error.response.data.message);
      // Preserve validation errors if present
      if (error.response.data.errors) {
        (backendError as any).errors = error.response.data.errors;
      }
      return Promise.reject(backendError);
    }

    // Check for network errors (no response)
    if (!error.response && error.config) {
      // Don't queue login/register requests
      const isAuthRequest = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');

      if (!isAuthRequest) {
        offlineManager.queueRequest(error.config);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const response = await apiClient.get<T>(endpoint, { params });
    return response.data;
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
  },

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.put<T>(endpoint, data);
    return response.data;
  },

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.patch<T>(endpoint, data);
    return response.data;
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<T>(endpoint);
    return response.data;
  },

  // Trip-specific API methods
  trips: {
    getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/trips?${queryString}` : '/trips';
      return await api.get<{ trips: DATABASE_TYPES.trips[]; pagination: any }>(endpoint);
    },
    getById: async (id: string) => {
      return await api.get<DATABASE_TYPES.trips>(`/trips/${id}`);
    },
    getBySlug: async (slug: string) => {
      return await api.get<DATABASE_TYPES.trips>(`/trips/slug/${slug}`);
    },
    create: async (tripData: Omit<DATABASE_TYPES.trips, 'id' | 'created_at' | 'updated_at'>) => {
      return await api.post<DATABASE_TYPES.trips>('/trips', tripData);
    },
    createFromTemplate: async (templateId: string, tripTitle?: string) => {
      return await api.post<DATABASE_TYPES.trips>(`/trips/create-from-template/${templateId}`, { title: tripTitle });
    },
    update: async (id: string, tripData: Partial<DATABASE_TYPES.trips>) => {
      return await api.put<DATABASE_TYPES.trips>(`/trips/${id}`, tripData);
    },
    delete: async (id: string) => {
      return await api.delete(`/trips/${id}`);
    },
    uploadAvatar: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      return await apiClient.post(`/trips/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    deleteAvatar: async (id: string) => {
      return await api.delete(`/trips/${id}/avatar`);
    },
  },

  // Member-specific API methods
  members: {
    getByTrip: async (tripId: string) => {
      return await api.get<DATABASE_TYPES.members[]>(`/trips/${tripId}/members`);
    },
    addToTrip: async (tripId: string, email: string) => {
      return await api.post<DATABASE_TYPES.members>(`/trips/${tripId}/members`, { email });
    },
    removeFromTrip: async (tripId: string, memberId: string) => {
      return await api.delete(`/trips/${tripId}/members/${memberId}`);
    },
    getInvitationByToken: async (token: string) => {
      return await api.get<any>(`/trips/invites/${token}`);
    },
    acceptInvite: async (token: string) => {
      return await api.post<any>('/trips/invites/accept', { token });
    },
    acceptInviteByMemberId: async (tripId: string, memberId: string) => {
      return await api.post<any>(`/trips/${tripId}/members/${memberId}/accept`);
    },
    resendInvitation: async (tripId: string, memberId: string) => {
      return await api.post<any>(`/trips/${tripId}/members/${memberId}/resend`);
    },
  },

  // Day-specific API methods
  days: {
    getByTrip: async (tripId: string) => {
      return await api.get<DATABASE_TYPES.days[]>(`/trips/${tripId}/days`);
    },
    create: async (dayData: Omit<DATABASE_TYPES.days, 'id' | 'created_at'>) => {
      return await api.post<DATABASE_TYPES.days>('/days', dayData);
    },
    update: async (id: string, dayData: Partial<DATABASE_TYPES.days>) => {
      // Use PATCH to match backend controller
      return await api.patch<DATABASE_TYPES.days>(`/days/${id}`, dayData);
    },
    delete: async (id: string) => {
      return await api.delete(`/days/${id}`);
    },
  },

  // Activity-specific API methods
  activities: {
    getByDay: async (dayId: string) => {
      return await api.get<DATABASE_TYPES.activities[]>(`/activities?dayId=${dayId}`);
    },
    create: async (activityData: Omit<DATABASE_TYPES.activities, 'id' | 'created_at'>) => {
      return await api.post<DATABASE_TYPES.activities>('/activities', activityData);
    },
    update: async (id: string, activityData: Partial<DATABASE_TYPES.activities>) => {
      return await api.patch<DATABASE_TYPES.activities>(`/activities/${id}`, activityData);
    },
    delete: async (id: string) => {
      return await api.delete(`/activities/${id}`);
    },
    reorder: async (activities: { id: string; sortOrder: number }[]) => {
      return await api.post('/activities/reorder', { activities });
    },
    uploadImage: async (activityId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await api.post<DATABASE_TYPES.activity_images>(`/activities/${activityId}/images`, formData);
    },
    getImages: async (activityId: string) => {
      return await api.get<DATABASE_TYPES.activity_images[]>(`/activities/${activityId}/images`);
    },
    deleteImage: async (imageId: string) => {
      return await api.delete(`/activities/images/${imageId}`);
    },
  },

  // Expense-specific API methods
  expenses: {
    getByTrip: async (tripId: string) => {
      return await api.get<DATABASE_TYPES.expenses[]>(`/expenses/trip/${tripId}`);
    },
    create: async (expenseData: {
      title: string;
      amount: number;
      date: string;
      description?: string;
      tripId: string;
      payerId: string;
      participantIds: string[];
      amounts?: number[];
    }) => {
      return await api.post<DATABASE_TYPES.expenses>('/expenses', expenseData);
    },
    update: async (id: string, expenseData: {
      title?: string;
      amount?: number;
      date?: string;
      description?: string;
      payerId?: string;
      participantIds?: string[];
      amounts?: number[];
    }) => {
      return await api.patch<DATABASE_TYPES.expenses>(`/expenses/${id}`, expenseData);
    },
    delete: async (id: string) => {
      return await api.delete(`/expenses/${id}`);
    },
    getById: async (id: string) => {
      return await api.get<DATABASE_TYPES.expenses>(`/expenses/${id}`);
    },
    // New expense calculation methods
    calculateTripExpenses: async (tripId: string) => {
      return await api.get<any>(`/expenses/trip/${tripId}/calculation`);
    },
    createPaymentSettlements: async (tripId: string) => {
      return await api.post(`/expenses/trip/${tripId}/settlements`);
    },
    getPaymentSettlements: async (tripId: string) => {
      return await api.get<any[]>(`/expenses/trip/${tripId}/settlements`);
    },
    updatePaymentSettlement: async (settlementId: string, updateData: {
      status?: 'pending' | 'completed' | 'cancelled';
      description?: string;
    }) => {
      return await api.patch<any>(`/expenses/settlements/${settlementId}`, updateData);
    },
    // Payment transactions
    createPaymentTransaction: async (
      settlementId: string,
      data: { amount: number; method?: string; note?: string; status?: 'pending' | 'success' | 'failed' }
    ) => {
      return await api.post<any>(`/expenses/settlements/${settlementId}/transactions`, data);
    },
    getPaymentTransactions: async (settlementId: string) => {
      return await api.get<any[]>(`/expenses/settlements/${settlementId}/transactions`);
    },
  },

  // Auth methods
  auth: {
    login: async (email: string, password: string) => {
      const response = await api.post<{ user: any; accessToken: string }>('/auth/login', { email, password });
      localStorage.setItem('accessToken', response.accessToken);
      return response;
    },
    register: async (email: string, password: string) => {
      const response = await api.post<{ user: any; accessToken: string }>('/auth/register', { email, password });
      localStorage.setItem('accessToken', response.accessToken);
      return response;
    },
    logout: async () => {
      localStorage.removeItem('accessToken');
      return await api.post('/auth/logout');
    },
    getUser: async () => {
      return await api.get('/auth/user');
    },
  },

  // User profile methods
  users: {
    getProfile: async () => {
      return await api.get<any>('/users/profile');
    },
    updateProfile: async (profileData: {
      fullName?: string;
      phoneNumber?: string;
      bankId?: string | null;
      bankNumber?: string | null;
    }) => {
      return await api.put<any>('/users/profile', profileData);
    },
    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    deleteAvatar: async () => {
      return await api.delete<any>('/users/avatar');
    },
    changePassword: async (passwordData: any) => {
      return await api.post<any>('/users/change-password', passwordData);
    },
  },

  // Trip Template-specific API methods
  tripTemplates: {
    getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/trip-templates?${queryString}` : '/trip-templates';
      return await api.get<{ templates: DATABASE_TYPES.tripTemplates[]; pagination: any }>(endpoint);
    },
    getPublic: async (params?: { search?: string; provinceId?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.provinceId) queryParams.append('provinceId', params.provinceId);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/trip-templates/public?${queryString}` : '/trip-templates/public';
      return await api.get<{ templates: DATABASE_TYPES.tripTemplates[]; pagination: any }>(endpoint);
    },
    getById: async (id: string) => {
      return await api.get<DATABASE_TYPES.tripTemplates>(`/trip-templates/${id}`);
    },
    create: async (templateData: Omit<DATABASE_TYPES.tripTemplates, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await api.post<DATABASE_TYPES.tripTemplates>('/trip-templates', templateData);
    },
    update: async (id: string, templateData: Partial<DATABASE_TYPES.tripTemplates>) => {
      return await api.patch<DATABASE_TYPES.tripTemplates>(`/trip-templates/${id}`, templateData);
    },
    delete: async (id: string) => {
      return await api.delete(`/trip-templates/${id}`);
    },
    duplicate: async (id: string, newTitle?: string) => {
      return await api.post<DATABASE_TYPES.tripTemplates>(`/trip-templates/${id}/duplicate`, { title: newTitle });
    },
    createTripFromTemplate: async (id: string, tripTitle?: string) => {
      return await api.post<{ template: DATABASE_TYPES.tripTemplates; suggestedTripData: any }>(`/trip-templates/${id}/create-trip`, { title: tripTitle });
    },
    getWishlist: async (params?: { page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/trip-templates/wishlist?${queryString}` : '/trip-templates/wishlist';
      return await api.get<{ templates: DATABASE_TYPES.tripTemplates[]; pagination: any }>(endpoint);
    },
    addToWishlist: async (id: string) => {
      return await api.post(`/trip-templates/${id}/wishlist`);
    },
    removeFromWishlist: async (id: string) => {
      return await api.delete(`/trip-templates/${id}/wishlist`);
    },
  },

  // Province-specific API methods
  provinces: {
    getAll: async () => {
      const response = await api.get<any>('/provinces', { limit: 100 });
      // If the response is already an array, return it directly
      if (Array.isArray(response)) return response;
      // Handle the case where it's wrapped in a .data property 
      if (response && Array.isArray(response.data)) return response.data;
      // Handle the case where it's wrapped in a .provinces property
      if (response && Array.isArray(response.provinces)) return response.provinces;
      return [];
    },
    getById: async (id: string) => {
      return await api.get<DATABASE_TYPES.provinces>(`/provinces/${id}`);
    },
  },

  // Utility methods
  utils: {
    generateSlug: async (text: string) => {
      return await api.post<{ slug: string }>('/utils/generate-slug', { text });
    },
  },
};

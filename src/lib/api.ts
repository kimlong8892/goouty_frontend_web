/**
 * API utilities for making authenticated requests
 */
import { envUtils } from './env';
import { DATABASE_TYPES } from '../integrations/api/types';

const API_BASE_URL = envUtils.getApiBaseUrl();

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const api = {
  /**
   * Make an authenticated request to the API
   */
  request: async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const accessToken = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type if it's not FormData (FormData sets its own Content-Type with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An unknown error occurred'
      }));

      const apiError = new Error(error.message || `API error: ${response.statusText}`) as any;
      apiError.status = response.status;
      apiError.statusText = response.statusText;

      throw apiError;
    }

    return await response.json();
  },

  /**
   * Helper methods for common HTTP methods
   */
  get: <T>(endpoint: string, params?: QueryParams, options: Omit<RequestInit, 'method'> = {}) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return api.request<T>(url, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, body: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return api.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put: <T>(endpoint: string, body: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return api.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch: <T>(endpoint: string, body: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
    return api.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete: <T>(endpoint: string, options: Omit<RequestInit, 'method'> = {}) => {
    return api.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Trip-specific API methods
  trips: {
    getAll: async (params?: { search?: string; page?: number; limit?: number; provinceId?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.provinceId) queryParams.append('provinceId', params.provinceId);

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
    update: async (id: string, tripData: Partial<DATABASE_TYPES.trips>) => {
      return await api.put<DATABASE_TYPES.trips>(`/trips/${id}`, tripData);
    },
    delete: async (id: string) => {
      return await api.delete(`/trips/${id}`);
    },
    uploadAvatar: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      return await api.request<{
        success: boolean;
        message: string;
        data: {
          url: string;
          key: string;
          bucket: string;
        };
        trip: DATABASE_TYPES.trips;
      }>(`/trips/${id}/avatar`, {
        method: 'POST',
        body: formData,
      });
    },
    deleteAvatar: async (id: string) => {
      return await api.request<{
        success: boolean;
        message: string;
        trip: DATABASE_TYPES.trips;
      }>(`/trips/${id}/avatar`, {
        method: 'DELETE',
      });
    },
    createFromUrl: async (url: string) => {
      return await api.post<{ message: string; tripId?: string }>('/trips/create-pending', { url });
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
      return await api.put<DATABASE_TYPES.days>(`/days/${id}`, dayData);
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
    uploadImage: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      return await api.request<{
        success: boolean;
        message: string;
        data: {
          url: string;
        };
        activity: DATABASE_TYPES.activities;
      }>(`/activities/${id}/avatar`, {
        method: 'POST',
        body: formData,
      });
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
    }) => {
      return await api.patch<DATABASE_TYPES.expenses>(`/expenses/${id}`, expenseData);
    },
    delete: async (id: string) => {
      return await api.delete(`/expenses/${id}`);
    },
    getById: async (id: string) => {
      return await api.get<DATABASE_TYPES.expenses>(`/expenses/${id}`);
    },
  },

  // Auth methods
  auth: {
    login: async (email: string, password: string) => {
      const response = await api.post<{ user: any; token: string }>('/auth/login', { email, password });
      localStorage.setItem('accessToken', response.token);
      return response;
    },
    register: async (email: string, password: string) => {
      const response = await api.post<{ user: any; token: string }>('/auth/register', { email, password });
      localStorage.setItem('accessToken', response.token);
      return response;
    },
    logout: async () => {
      localStorage.removeItem('accessToken');
      return await api.post('/auth/logout', {});
    },
    getUser: async () => {
      return await api.get('/auth/user');
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

  // Rating-specific API methods
  ratings: {
    create: async (ratingData: { stars: number; content: string }) => {
      return await api.post<DATABASE_TYPES.ratings>('/ratings', ratingData);
    },
    check: async () => {
      return await api.get<{ hasRated: boolean; rating: DATABASE_TYPES.ratings | null }>('/ratings/check');
    },
    getAll: async (params?: { page?: number; limit?: number; userId?: string }) => {
      return await api.get<{
        data: DATABASE_TYPES.ratings[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }
      }>('/ratings', params);
    },
  },

  // Utility methods
  utils: {
    generateSlug: async (text: string) => {
      return await api.post<{ slug: string }>('/utils/generate-slug', { text });
    },
  },
};

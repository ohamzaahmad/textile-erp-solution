// API Configuration and Client for HA FABRICS ERP

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Token management
export const TokenManager = {
  getAccessToken: (): string | null => localStorage.getItem('access_token'),
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// API Client with automatic token refresh
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - token expired, try to refresh
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            const error = await retryResponse.json().catch(() => ({}));
            console.error('API Error Response (retry):', error);
            throw new Error(error.detail || JSON.stringify(error) || `HTTP error! status: ${retryResponse.status}`);
          }
          
          const data = await retryResponse.json();
          
          // Handle paginated responses from DRF
          if (data && typeof data === 'object' && 'results' in data) {
            return data.results;
          }
          
          return data;
        } else {
          // Refresh failed, clear tokens and redirect to login
          TokenManager.clearTokens();
          emitToast('Session expired. Please sign in again.', 'error');
          window.location.reload();
          throw new Error('Session expired');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('API Error Response:', error);
        const message = error.detail || error.message || JSON.stringify(error) || `HTTP error! status: ${response.status}`;
        emitToast(typeof message === 'string' ? message : 'Server error', 'error');
        throw new Error(message);
      }

      const data = await response.json();
      
      // Handle paginated responses from DRF
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }
      
      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      try {
        const msg = (error && error.message) ? error.message : 'Request failed';
        emitToast(msg, 'error');
      } catch {}
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.access, refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Small helper to show toasts via window events
export const emitToast = (message: string, level: 'info' | 'success' | 'error' = 'error') => {
  try {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, level } }));
  } catch (e) {
    // ignore when not running in browser
  }
};

export const api = new ApiClient(API_BASE_URL);

// API Service functions
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post<{ access: string; refresh: string }>('/auth/login/', {
      username,
      password,
    });
    TokenManager.setTokens(response.access, response.refresh);
    return response;
  },

  logout: () => {
    TokenManager.clearTokens();
  },

  getCurrentUser: () => api.get<any>('/users/me/'),
};

export const vendorsAPI = {
  getAll: () => api.get<any[]>('/vendors/'),
  getById: (id: string) => api.get<any>(`/vendors/${id}/`),
  create: (data: any) => api.post<any>('/vendors/', data),
  update: (id: string, data: any) => api.put<any>(`/vendors/${id}/`, data),
  delete: (id: string) => api.delete(`/vendors/${id}/`),
  getTransactions: (id: string) => api.get<any[]>(`/vendors/${id}/transactions/`),
  updateBalance: (id: string) => api.post<any>(`/vendors/${id}/update_balance/`, {}),
};

export const customersAPI = {
  getAll: () => api.get<any[]>('/customers/'),
  getById: (id: string) => api.get<any>(`/customers/${id}/`),
  create: (data: any) => api.post<any>('/customers/', data),
  update: (id: string, data: any) => api.put<any>(`/customers/${id}/`, data),
  delete: (id: string) => api.delete(`/customers/${id}/`),
  getTransactions: (id: string) => api.get<any[]>(`/customers/${id}/transactions/`),
  updateBalance: (id: string) => api.post<any>(`/customers/${id}/update_balance/`, {}),
};

export const inventoryAPI = {
  getAll: () => api.get<any[]>('/inventory/'),
  getById: (id: string) => api.get<any>(`/inventory/${id}/`),
  create: (data: any) => api.post<any>('/inventory/', data),
  update: (id: string, data: any) => api.put<any>(`/inventory/${id}/`, data),
  delete: (id: string) => api.delete(`/inventory/${id}/`),
  getSummary: () => api.get<any>('/inventory/summary/'),
  getByVendor: () => api.get<any[]>('/inventory/by_vendor/'),
  markBilled: (id: string) => api.post<any>(`/inventory/${id}/mark_billed/`, {}),
};

export const itemMasterAPI = {
  getAll: () => api.get<any[]>('/item-master/'),
  getById: (id: string) => api.get<any>(`/item-master/${id}/`),
  create: (data: any) => api.post<any>('/item-master/', data),
  update: (id: string, data: any) => api.put<any>(`/item-master/${id}/`, data),
  delete: (id: string) => api.delete(`/item-master/${id}/`),
  getCategories: () => api.get<string[]>('/item-master/categories/'),
};

export const invoicesAPI = {
  getAll: () => api.get<any[]>('/invoices/'),
  getById: (id: string) => api.get<any>(`/invoices/${id}/`),
  create: (data: any) => api.post<any>('/invoices/', data),
  update: (id: string, data: any) => api.put<any>(`/invoices/${id}/`, data),
  delete: (id: string) => api.delete(`/invoices/${id}/`),
  addPayment: (id: string, payment: any) => api.post<any>(`/invoices/${id}/add_payment/`, payment),
  getSummary: () => api.get<any>('/invoices/summary/'),
  getOverdue: () => api.get<any[]>('/invoices/overdue/'),
};

export const billsAPI = {
  getAll: () => api.get<any[]>('/bills/'),
  getById: (id: string) => api.get<any>(`/bills/${id}/`),
  create: (data: any) => api.post<any>('/bills/', data),
  update: (id: string, data: any) => api.put<any>(`/bills/${id}/`, data),
  delete: (id: string) => api.delete(`/bills/${id}/`),
  addPayment: (id: string, payment: any) => api.post<any>(`/bills/${id}/add_payment/`, payment),
  getSummary: () => api.get<any>('/bills/summary/'),
  getOverdue: () => api.get<any[]>('/bills/overdue/'),
};

export const transactionsAPI = {
  getAll: () => api.get<any[]>('/transactions/'),
  getById: (id: string) => api.get<any>(`/transactions/${id}/`),
  getSummary: () => api.get<any>('/transactions/summary/'),
};

export const paymentsAPI = {
  getAll: () => api.get<any[]>('/payments/'),
  getById: (id: string) => api.get<any>(`/payments/${id}/`),
};

export const expensesAPI = {
  getAll: () => api.get<any[]>('/expenses/'),
  getById: (id: string) => api.get<any>(`/expenses/${id}/`),
  create: (data: any) => api.post<any>('/expenses/', data),
  update: (id: string, data: any) => api.put<any>(`/expenses/${id}/`, data),
  delete: (id: string) => api.delete(`/expenses/${id}/`),
  getSummary: () => api.get<any>('/expenses/summary/'),
};

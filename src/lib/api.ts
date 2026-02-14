const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (res.status === 403) {
      throw new Error('Admin access required');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async login(email: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, code: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  async getUsers(search?: string) {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/admin/users${params}`);
  }

  async getUser(id: string) {
    return this.request(`/admin/users/${id}`);
  }

  async getPackages(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return this.request(`/admin/packages${qs ? `?${qs}` : ''}`);
  }

  async getPackage(id: string) {
    return this.request(`/admin/packages/${id}`);
  }

  async updatePackage(id: string, data: any) {
    return this.request(`/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkUpdatePackageStatus(packageIds: string[], status: string) {
    return this.request('/admin/packages/bulk-status', {
      method: 'PUT',
      body: JSON.stringify({ packageIds, status }),
    });
  }

  async getShipments(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return this.request(`/admin/shipments${qs ? `?${qs}` : ''}`);
  }

  async getShipment(id: string) {
    return this.request(`/admin/shipments/${id}`);
  }

  async updateShipment(id: string, data: any) {
    return this.request(`/admin/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateShipmentStatus(id: string, data: { status: string; notes?: string; location?: string }) {
    return this.request(`/admin/shipments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getBills(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString();
    return this.request(`/admin/bills${qs ? `?${qs}` : ''}`);
  }

  async createBill(data: { shipmentId: string; shippingFee: number; clearingFee: number; additionalFees?: number }) {
    return this.request('/admin/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingPayments() {
    return this.request('/admin/bills/pending-payments');
  }

  async verifyPayment(paymentId: string, data: { status: string; notes?: string }) {
    return this.request(`/admin/bills/payments/${paymentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
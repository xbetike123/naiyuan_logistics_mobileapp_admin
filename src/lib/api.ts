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


  // Master Shipments
  async getMasterShipments(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/admin/master-shipments${params}`);
  }

  async getMasterShipment(id: string) {
    return this.request(`/admin/master-shipments/${id}`);
  }

  async createMasterShipment(data: {
    method: string;
    route?: string;
    destination?: string;
    estimatedArrival?: string;
    shipmentIds: string[];
  }) {
    return this.request('/admin/master-shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMasterShipmentStatus(id: string, data: { status: string; trackingCode?: string; notes?: string; location?: string }) {
    return this.request(`/admin/master-shipments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async addShipmentDetailsAndGenerateBill(
    shipmentId: string,
    data: {
      weightKg: number;
      volumeCBM?: number;
      billingMethod: string;
      packingFee?: number;
      additionalFees?: number;
      notes?: string;
    },
  ) {
    return this.request(`/admin/shipments/${shipmentId}/details-and-bill`, {
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

  // Shipping Rates
  async getShippingRates() {
    return this.request('/admin/rates');
  }

  async createShippingRate(data: {
    category: string;
    label: string;
    billingUnit: string;
    freightCostUSD: number;
    clearingCost: number;
    clearingCurrency: string;
    minChargeUSD?: number;
    description?: string;
  }) {
    return this.request('/admin/rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShippingRate(id: string, data: any) {
    return this.request(`/admin/rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteShippingRate(id: string) {
    return this.request(`/admin/rates/${id}`, {
      method: 'DELETE',
    });
  }

  // Exchange Rates
  async getExchangeRates() {
    return this.request('/admin/exchange-rates');
  }

  async createExchangeRate(data: { fromCurrency: string; toCurrency: string; rate: number }) {
    return this.request('/admin/exchange-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  // Tracking Statuses
  async getTrackingStatuses() {
    return this.request('/admin/tracking-statuses');
  }

  async createTrackingStatus(data: { code: string; label: string; description?: string; sortOrder?: number }) {
    return this.request('/admin/tracking-statuses', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTrackingStatus(id: string, data: any) {
    return this.request(`/admin/tracking-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTrackingStatus(id: string) {
    return this.request(`/admin/tracking-statuses/${id}`, { method: 'DELETE' });
  }

  // Tracking Locations
  async getTrackingLocations() {
    return this.request('/admin/tracking-locations');
  }

  async createTrackingLocation(data: { code: string; label: string; country?: string; sortOrder?: number }) {
    return this.request('/admin/tracking-locations', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTrackingLocation(id: string, data: any) {
    return this.request(`/admin/tracking-locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTrackingLocation(id: string) {
    return this.request(`/admin/tracking-locations/${id}`, { method: 'DELETE' });
  }


  // Shipment Requests
  async getShipmentRequests() {
    return this.request('/admin/shipment-requests');
  }

  async approveShipmentRequest(id: string) {
    return this.request(`/admin/shipment-requests/${id}/approve`, { method: 'PUT' });
  }

  async rejectShipmentRequest(id: string, reason?: string) {
    return this.request(`/admin/shipment-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) });
  }

  // Pickups
  async getPickupRequests(status?: string, date?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (date) params.set('date', date);
    const qs = params.toString();
    return this.request(`/admin/pickups${qs ? `?${qs}` : ''}`);
  }

  async updatePickupStatus(pickupId: string, data: { status: string; notes?: string }) {
    return this.request(`/admin/pickups/${pickupId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPickupSlots(date: string) {
    return this.request(`/admin/pickup-slots?date=${date}`);
  }

  async createPickupSlot(data: { date: string; startTime: string; endTime: string; maxPickups?: number }) {
    return this.request('/admin/pickup-slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreatePickupSlots(data: { date: string; slots: { startTime: string; endTime: string }[]; maxPickups?: number }) {
    return this.request('/admin/pickup-slots/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePickupSlot(slotId: string, data: { maxPickups?: number; isActive?: boolean }) {
    return this.request(`/admin/pickup-slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePickupSlot(slotId: string) {
    return this.request(`/admin/pickup-slots/${slotId}`, {
      method: 'DELETE',
    });
  }

}

export const api = new ApiClient();

// Vercel Serverless Functions live under /api on the same origin as the
// frontend, so no base URL is needed in production. VITE_API_BASE_URL can
// still be set to point at a different host during local development.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'API error');
  return data as T;
}

// ── Booking types ─────────────────────────────────────────────────────
export interface BookingPayload {
  id: string;
  facility_type: string;
  date: string;
  start_time: string;
  duration_hours: number;
  resident_unit: string;
  status?: string;
  details?: string;
  qr_code?: string;
  is_overnight?: boolean;
  user_id?: string;
}

export interface ApiBooking extends BookingPayload {
  status: string;
  created_at?: string;
}

// ── API calls ─────────────────────────────────────────────────────────

export const bookingsApi = {
  getByUser: (userId: string) =>
    request<ApiBooking[]>(`bookings?user_id=${userId}`),

  getById: (id: string) =>
    request<ApiBooking[]>(`bookings?id=${id}`),

  getByFacilityAndDate: (facilityType: string, date: string) =>
    request<ApiBooking[]>(`bookings?facility_type=${facilityType}&date=${date}`),

  create: (booking: BookingPayload) =>
    request<ApiBooking[]>('bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    }),

  updateStatus: (id: string, status: string) =>
    request<ApiBooking[]>('bookings', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),

  validate: (id: string) =>
    request<{ valid: boolean; booking?: ApiBooking }>('validate', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};

// ── Maintenance types ────────────────────────────────────────────────
export interface MaintenancePayload {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  description?: string;
  location?: string;
  priority?: string;
  images?: string[];
  resident_unit?: string;
  user_id?: string;
}

export interface ApiMaintenanceTask extends MaintenancePayload {
  status: string;
  expected_response: string;
  created_at?: string;
}

export const maintenanceApi = {
  getByUser: (userId: string) =>
    request<ApiMaintenanceTask[]>(`maintenance?user_id=${userId}`),

  getRecent: (limit = 10) =>
    request<ApiMaintenanceTask[]>(`maintenance?limit=${limit}`),

  create: (task: MaintenancePayload) =>
    request<ApiMaintenanceTask[]>('maintenance', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateStatus: (id: string, status: string) =>
    request<ApiMaintenanceTask[]>('maintenance', {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    }),
};

// ── Analytics ────────────────────────────────────────────────────────
export interface AnalyticsResponse {
  facilityUsage: { name: string; hours: number }[];
  bookingsByDay: { name: string; bookings: number }[];
  taskStatusBreakdown: { status: string; count: number }[];
  recentMaintenanceTasks: ApiMaintenanceTask[];
}

export const analyticsApi = {
  get: () => request<AnalyticsResponse>('analytics'),
};

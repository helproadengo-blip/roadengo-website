// routing/apiClient.js - VITE COMPATIBLE VERSION
import axios from 'axios';

// Base URL Configuration - FIXED FOR VITE
const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.roadengo.com/api';

// Create Axios Instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials:true
});

/**
 * Which panel the user is currently in.
 *
 * The token is chosen by panel, NOT by guessing from the request URL. Several
 * routes are shared between the two roles (/appointments/open is mechanic-only,
 * /appointments is admin) so a URL can't tell you which token it wants. On a
 * laptop where the owner had also signed into the admin panel, a leftover
 * adminToken was being sent on the mechanic panel's calls; the backend
 * (rightly) answered 401, the handler below wiped both tokens, and the mechanic
 * was thrown back to a login screen mid-task.
 */
export function currentPanel() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/mechanic')) return 'mechanic';
  if (path.startsWith('/admin')) return 'admin';
  return null; // a public page — use whichever session exists
}

function tokenForRequest() {
  const adminToken = localStorage.getItem('adminToken');
  const mechanicToken = localStorage.getItem('mechanicToken');
  const panel = currentPanel();

  if (panel === 'mechanic') return mechanicToken || null;
  if (panel === 'admin') return adminToken || null;
  return adminToken || mechanicToken || null;
}

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('🔄 API Request:', config.method?.toUpperCase(), config.url);

    const token = tokenForRequest();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - FIXED NO AUTO LOGOUT FOR ASSIGNMENT ERRORS
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 errors — a 401 always means the token is missing/expired/invalid
    // (the backend never uses 401 for business-logic failures like a bad
    // assignment), so every 401 should clear stale tokens and send the user
    // back to log in rather than silently rendering empty lists/zero counts.
    if (error.response?.status === 401) {
      // Sign out only the panel the user is actually in. Wiping both sessions
      // meant one expired token logged the person out of the other role too,
      // and sent a mechanic to the admin login screen.
      const panel = currentPanel();
      console.log('🔐 Authentication error detected, clearing the', panel || 'current', 'session');

      if (panel === 'mechanic') {
        localStorage.removeItem('mechanicToken');
        localStorage.removeItem('mechanicData');
      } else if (panel === 'admin') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        localStorage.removeItem('mechanicToken');
        localStorage.removeItem('mechanicData');
      }

      setTimeout(() => {
        window.location.href = panel === 'mechanic' ? '/mechanic/login' : '/admin/login';
      }, 1000);
    }
    
    return Promise.reject(error);
  }
);

// API Endpoints
export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/health',
  
  // Authentication
  ADMIN_LOGIN: '/auth/login',
  CREATE_ADMIN: '/auth/create-admin',
  LOGOUT: '/auth/logout',
  
  // Admin Dashboard
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_METRICS: '/admin/metrics',
  ADMIN_ACTIVITIES: '/admin/recent-activities',
  ADMIN_BOOKINGS_BY_LOCATION: '/admin/bookings-by-location',
  ADMIN_BOOKING_LOCATIONS: '/admin/booking-locations',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BY_ID: (id) => `/appointments/${id}`,
  CREATE_APPOINTMENT: '/appointments',
  AVAILABLE_SLOTS: '/appointments/available-slots',
  
  // Emergency Services
  EMERGENCY: '/emergency',
  EMERGENCY_BY_ID: (id) => `/emergency/${id}`,
  CREATE_EMERGENCY: '/emergency',
  ASSIGN_EMERGENCY: (id) => `/emergency/${id}/assign`,
  UNASSIGN_EMERGENCY: (id) => `/emergency/${id}/unassign`,
  
  // Inquiries
  INQUIRIES: '/inquiries',
  INQUIRY_BY_ID: (id) => `/inquiries/${id}`,
  CREATE_INQUIRY: '/inquiries',
    
  // Contact Forms
  CONTACT_FORMS: '/contact-forms',
  
  // Mechanics
  MECHANICS: '/mechanics',
  NEARBY_MECHANICS: '/mechanics/nearby',
  MECHANIC_LOGIN: '/mechanics/login',
  MECHANIC_REGISTER: '/mechanics/register',
  AVAILABLE_MECHANICS: '/mechanics/available',
  ASSIGN_TASK: '/mechanics/assign-task',
  
  // Mechanic Dashboard
  MECHANIC_DASHBOARD: '/mechanic-dashboard/stats',
  MECHANIC_TASKS: '/mechanic-dashboard/tasks',
  UPDATE_TASK_STATUS: (taskId) => `/mechanic-dashboard/tasks/${taskId}/status`,
  UPDATE_MECHANIC_LOCATION: '/mechanic-dashboard/location',
  GET_ROUTE_INFO: (taskId) => `/mechanic-dashboard/route/${taskId}`,
  UPDATE_AVAILABILITY: '/mechanic-dashboard/availability',
  MECHANIC_BILLS: '/mechanic-dashboard/bills',
  REJECT_TASK: (taskId) => `/mechanic-dashboard/tasks/${taskId}/reject`,
  OPEN_BOOKINGS: '/appointments/open',
  OPEN_EMERGENCIES: '/emergency/open',
  ACCEPT_BOOKING: (id) => `/appointments/${id}/accept`,
  ACCEPT_EMERGENCY: (id) => `/emergency/${id}/accept`,
  APPOINTMENT_BILL: (id) => `/appointments/${id}/bill`,

  // Spare Parts
  PARTS: '/parts',
  PART_CATEGORIES: '/parts/categories',
  PART_BRANDS: '/parts/brands',
  PARTS_ADMIN: '/parts/admin/list',
  PART_ORDERS: '/parts/orders/all',
  PART_ORDER_BY_ID: (id) => `/parts/orders/${id}`,
  PART_BY_ID: (id) => `/parts/${id}`,

  // Partners
  PARTNERS: '/partners',
  PARTNER_BY_ID: (id) => `/partners/${id}`,

  // Parts issued to mechanics ("Bill to Mechanic")
  MECHANIC_STOCK_ISSUE: '/mechanic-stock/issue',
  MECHANIC_STOCK_FOR: (id) => `/mechanic-stock/mechanic/${id}`,
  MECHANIC_STOCK_MINE: '/mechanic-stock/my',

  // Subscriptions
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTIONS_BY_PHONE: (phone) => `/subscriptions/by-phone/${encodeURIComponent(phone)}`,
  SUBSCRIPTION_BY_ID: (id) => `/subscriptions/${id}`,
};

// API Service Functions
export const apiService = {
  // Health Check
  healthCheck: () => apiClient.get(API_ENDPOINTS.HEALTH),
  
  // Authentication
  adminLogin: (credentials) => apiClient.post(API_ENDPOINTS.ADMIN_LOGIN, credentials),
  createAdmin: (adminData) => apiClient.post(API_ENDPOINTS.CREATE_ADMIN, adminData),
  logout: () => apiClient.post(API_ENDPOINTS.LOGOUT),
  
  // Appointments
  getAppointments: (params) => apiClient.get(API_ENDPOINTS.APPOINTMENTS, { params }),
  getAppointmentById: (id) => apiClient.get(API_ENDPOINTS.APPOINTMENT_BY_ID(id)),
  createAppointment: (data) => apiClient.post(API_ENDPOINTS.CREATE_APPOINTMENT, data),
  updateAppointment: (id, data) => apiClient.patch(API_ENDPOINTS.APPOINTMENT_BY_ID(id), data),
  deleteAppointment: (id) => apiClient.delete(API_ENDPOINTS.APPOINTMENT_BY_ID(id)),
  getAvailableSlots: (date) => apiClient.get(`${API_ENDPOINTS.AVAILABLE_SLOTS}?date=${date}`),
  
  // Emergency Services
  getEmergencies: (params) => apiClient.get(API_ENDPOINTS.EMERGENCY, { params }),
  getEmergencyById: (id) => apiClient.get(API_ENDPOINTS.EMERGENCY_BY_ID(id)),
  createEmergency: (data) => apiClient.post(API_ENDPOINTS.CREATE_EMERGENCY, data),
  updateEmergency: (id, data) => apiClient.patch(API_ENDPOINTS.EMERGENCY_BY_ID(id), data),
  deleteEmergency: (id) => apiClient.delete(API_ENDPOINTS.EMERGENCY_BY_ID(id)),
  
  // Inquiries
  getInquiries: (params) => apiClient.get(API_ENDPOINTS.INQUIRIES, { params }),
  getInquiryById: (id) => apiClient.get(API_ENDPOINTS.INQUIRY_BY_ID(id)),
  createInquiry: (data) => apiClient.post(API_ENDPOINTS.CREATE_INQUIRY, data),
  updateInquiry: (id, data) => apiClient.patch(API_ENDPOINTS.INQUIRY_BY_ID(id), data),
  deleteInquiry: (id) => apiClient.delete(API_ENDPOINTS.INQUIRY_BY_ID(id)),

    
  // Contact Forms
  getContactForms: (params) => apiClient.get(API_ENDPOINTS.CONTACT_FORMS, { params }),
  createContactForm:  (data) => apiClient.post(API_ENDPOINTS. CONTACT_FORMS, data),
  updateContactFormStatus: (id, data) => apiClient.patch(`${API_ENDPOINTS.CONTACT_FORMS}/${id}`, data),
  
  // Dashboard Stats
  getDashboardStats: (params) => apiClient.get(API_ENDPOINTS.ADMIN_DASHBOARD, { params }),
  getBookingsByLocation: () => apiClient.get(API_ENDPOINTS.ADMIN_BOOKINGS_BY_LOCATION),
  // Bookings grouped into geographic buckets for the admin map.
  getBookingLocations: (precision = 2) =>
    apiClient.get(API_ENDPOINTS.ADMIN_BOOKING_LOCATIONS, { params: { precision } }),
  getAdminMetrics: (params) => apiClient.get(API_ENDPOINTS.ADMIN_METRICS, { params }),
  getRecentActivities: (params) => apiClient.get(API_ENDPOINTS.ADMIN_ACTIVITIES, { params }),
  
  // Mechanic Management (Admin)
  getMechanics: (params) => apiClient.get(API_ENDPOINTS.MECHANICS, { params }),
  // Public: anonymous coordinates of mechanics who are online (no identity).
  getNearbyMechanics: (lat, lng) =>
    apiClient.get(API_ENDPOINTS.NEARBY_MECHANICS, { params: { lat, lng, radiusKm: 25 } }),
  registerMechanic: (data) => apiClient.post(API_ENDPOINTS.MECHANIC_REGISTER, data),
  // Multipart variant — used by the "Add New Mechanic" form which can include
  // a profile photo + Aadhaar front/back files. Bypasses the shared axios
  // instance (which defaults to Content-Type: application/json) so the
  // browser can set its own multipart boundary.
  registerMechanicWithFiles: async (formData) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.MECHANIC_REGISTER}`, {
      method: 'POST',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to register mechanic');
      err.response = { data };
      throw err;
    }
    return { data };
  },
  getAvailableMechanics: (params) => apiClient.get(API_ENDPOINTS.AVAILABLE_MECHANICS, { params }),
  assignTask: (data) => apiClient.post(API_ENDPOINTS.ASSIGN_TASK, data),
  updateMechanic: (id, data) => apiClient.patch(`${API_ENDPOINTS.MECHANICS}/${id}`, data),
  deleteMechanic: (id) => apiClient.delete(`${API_ENDPOINTS.MECHANICS}/${id}`),
  resetMechanicPassword: (id, password) => apiClient.patch(`${API_ENDPOINTS.MECHANICS}/${id}/reset-password`, { password }),
  
  // Mechanic Authentication
  mechanicLogin: (credentials) => apiClient.post(API_ENDPOINTS.MECHANIC_LOGIN, credentials),
  
  // Mechanic Dashboard
  getMechanicDashboard: () => apiClient.get(API_ENDPOINTS.MECHANIC_DASHBOARD),
  getMechanicTasks: (params) => apiClient.get(API_ENDPOINTS.MECHANIC_TASKS, { params }),
  updateTaskStatus: (taskId, data) => apiClient.patch(API_ENDPOINTS.UPDATE_TASK_STATUS(taskId), data),
  updateMechanicLocation: (data) => apiClient.post(API_ENDPOINTS.UPDATE_MECHANIC_LOCATION, data),
  getRouteInfo: (taskId, taskType) => apiClient.get(`${API_ENDPOINTS.GET_ROUTE_INFO(taskId)}?taskType=${taskType}`),
  updateAvailability: (data) => apiClient.patch(API_ENDPOINTS.UPDATE_AVAILABILITY, data),

  // --- Mechanic panel: the same dispatch/billing flow the app has, so a
  // mechanic can work entirely from the website with the same login. ---
  getOpenBookings: () => apiClient.get(API_ENDPOINTS.OPEN_BOOKINGS),
  getOpenEmergencies: () => apiClient.get(API_ENDPOINTS.OPEN_EMERGENCIES),
  // Both pools, tagged so the UI can treat them uniformly (emergencies first).
  getAllOpenJobs: async () => {
    const [appts, emgs] = await Promise.all([
      apiClient.get(API_ENDPOINTS.OPEN_BOOKINGS).catch(() => ({ data: { data: [] } })),
      apiClient.get(API_ENDPOINTS.OPEN_EMERGENCIES).catch(() => ({ data: { data: [] } })),
    ]);
    const a = (appts.data?.data || appts.data || []).map((j) => ({ ...j, taskType: 'appointment' }));
    const e = (emgs.data?.data || emgs.data || []).map((j) => ({ ...j, taskType: 'emergency' }));
    return [...e, ...a];
  },
  acceptJob: (id, taskType) =>
    apiClient.post(
      taskType === 'emergency' ? API_ENDPOINTS.ACCEPT_EMERGENCY(id) : API_ENDPOINTS.ACCEPT_BOOKING(id)
    ),
  rejectAssignedTask: (taskId, taskType) =>
    apiClient.post(API_ENDPOINTS.REJECT_TASK(taskId), { taskType }),
  getMechanicBills: () => apiClient.get(API_ENDPOINTS.MECHANIC_BILLS),
  sendBillAsMechanic: (appointmentId, lines, discount = 0) =>
    apiClient.post(API_ENDPOINTS.APPOINTMENT_BILL(appointmentId), { lines, discount }),
  getBill: (appointmentId) => apiClient.get(API_ENDPOINTS.APPOINTMENT_BILL(appointmentId)),

  // Spare Parts (public read; admin write with optional photo)
  getParts: (params) => apiClient.get(API_ENDPOINTS.PARTS, { params }),
  getPartCategories: () => apiClient.get(API_ENDPOINTS.PART_CATEGORIES),
  getPartBrands: () => apiClient.get(API_ENDPOINTS.PART_BRANDS),
  // Admin list includes purchasePrice, which customer routes never return.
  getPartsAdmin: () => apiClient.get(API_ENDPOINTS.PARTS_ADMIN),
  getPartOrders: () => apiClient.get(API_ENDPOINTS.PART_ORDERS),
  updatePartOrder: (id, status) => apiClient.patch(API_ENDPOINTS.PART_ORDER_BY_ID(id), { status }),
  getPart: (id) => apiClient.get(API_ENDPOINTS.PART_BY_ID(id)),
  createPart: async (formData) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.PARTS}`, {
      method: 'POST',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to create part');
      err.response = { data };
      throw err;
    }
    return { data };
  },
  updatePart: async (id, formData) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.PART_BY_ID(id)}`, {
      method: 'PATCH',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to update part');
      err.response = { data };
      throw err;
    }
    return { data };
  },
  deletePart: (id) => apiClient.delete(API_ENDPOINTS.PART_BY_ID(id)),

  // Partners — garages/franchises that bring or take on business.
  getPartners: () => apiClient.get(API_ENDPOINTS.PARTNERS),
  createPartner: async (formData) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.PARTNERS}`, {
      method: 'POST',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to add partner');
      err.response = { data };
      throw err;
    }
    return { data };
  },
  updatePartner: async (id, formData) => {
    const adminToken = localStorage.getItem('adminToken');
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.PARTNER_BY_ID(id)}`, {
      method: 'PATCH',
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Failed to update partner');
      err.response = { data };
      throw err;
    }
    return { data };
  },
  deletePartner: (id) => apiClient.delete(API_ENDPOINTS.PARTNER_BY_ID(id)),

  // Parts issued to a mechanic, and what they still carry.
  issuePartsToMechanic: (mechanicId, items) =>
    apiClient.post(API_ENDPOINTS.MECHANIC_STOCK_ISSUE, { mechanicId, items }),
  getMechanicStock: (mechanicId) => apiClient.get(API_ENDPOINTS.MECHANIC_STOCK_FOR(mechanicId)),
  getMyStock: () => apiClient.get(API_ENDPOINTS.MECHANIC_STOCK_MINE),

  // Subscriptions — the same plans and records the app uses.
  getSubscriptionPlans: () => apiClient.get(API_ENDPOINTS.SUBSCRIPTION_PLANS),
  createSubscription: (body) =>
    apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS, { ...body, source: 'website' }),
  getSubscriptionsByPhone: (phone) => apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS_BY_PHONE(phone)),
  // Admin
  getSubscriptions: () => apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS),
  updateSubscription: (id, body) => apiClient.patch(API_ENDPOINTS.SUBSCRIPTION_BY_ID(id), body),
};

// Status Constants
export const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CONTACTED: 'contacted',
  QUOTED: 'quoted',
  ASSIGNED: 'assigned',
};

// Urgency Levels
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Service Types
export const SERVICE_TYPES = {
  BIKE_SERVICE: 'bike-service',
  EMERGENCY_REPAIR: 'emergency-repair',
  DOORSTEP_SERVICE: 'doorstep-service',
  PARTS_REPLACEMENT: 'parts-replacement',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection',
  GENERAL_SERVICE: 'general-service',
  OIL_CHANGE: 'oil-change',
  BRAKE_SERVICE: 'brake-service',
  CHAIN_CLEANING: 'chain-cleaning',
  COMPLETE_OVERHAUL: 'complete-overhaul',
  // The rest of the eight services on the home grid.
  PUNCTURE_REPAIR: 'puncture-repair',
  TYRE_REPLACE: 'tyre-replace',
  BATTERY_CHANGE: 'battery-change',
  STARTING_PROBLEM: 'starting-problem',
  ENGINE_REPAIR: 'engine-repair',
};

// Mechanic Availability Status
export const MECHANIC_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

// Task Types
export const TASK_TYPES = {
  APPOINTMENT: 'appointment',
  EMERGENCY: 'emergency',
  INQUIRY: 'inquiry',
};

// Order Status
export const ORDER_STATUS = {
  PLACED: 'placed',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out-for-delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
  MECHANIC: 'mechanic',
  SUPPORT: 'support',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export default apiClient;

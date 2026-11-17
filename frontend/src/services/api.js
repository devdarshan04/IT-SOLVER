const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('fixtrail_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  // If body is not FormData, set Content-Type to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized and has token, clear token
    if (localStorage.getItem('fixtrail_token')) {
      localStorage.removeItem('fixtrail_token');
      localStorage.removeItem('fixtrail_user');
      window.dispatchEvent(new Event('fixtrail_auth_change'));
    }
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || errorDetail;
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request('/auth/me'),
  },

  // Issues & AI Troubleshooting
  issues: {
    analyze: (formData) =>
      request('/issues/analyze', {
        method: 'POST',
        body: formData,
      }),
    create: (formData) =>
      request('/issues/', {
        method: 'POST',
        body: formData,
      }),
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.all_users) query.append('all_users', 'true');
      return request(`/issues/?${query.toString()}`);
    },
    getById: (id) => request(`/issues/${id}`),
    update: (id, data) =>
      request(`/issues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    publishToKb: (id) =>
      request(`/issues/${id}/publish-to-kb`, {
        method: 'POST',
      }),
    delete: (id) =>
      request(`/issues/${id}`, {
        method: 'DELETE',
      }),
  },

  // Knowledge Base
  knowledge: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', params.category);
      if (params.platform) query.append('platform', params.platform);
      if (params.sort_by) query.append('sort_by', params.sort_by);
      return request(`/knowledge/?${query.toString()}`);
    },
    getById: (id) => request(`/knowledge/${id}`),
    markHelpful: (id) =>
      request(`/knowledge/${id}/helpful`, {
        method: 'POST',
      }),
    create: (data) =>
      request('/knowledge/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/knowledge/${id}`, {
        method: 'DELETE',
      }),
  },

  // Admin Analytics
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
  },

  // System & Settings
  system: {
    getStatus: () => request('/system/status'),
    setApiKey: (data) =>
      request('/system/set-key', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

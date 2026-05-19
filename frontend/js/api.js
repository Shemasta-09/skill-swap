const API_URL = 'http://localhost:5000/api';

const api = {
  getToken: () => localStorage.getItem('token'),
  
  headers: function() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  async request(endpoint, options = {}) {
    try {
      const token = this.getToken();
      const bodyIsForm = options.body instanceof FormData;
      const headers = {
        ...(bodyIsForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (_) {
        data = { message: responseText };
      }

      if (!response.ok) {
        throw new Error(data.message || response.statusText || 'Something went wrong');
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  auth: {
    login: (credentials) => api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    register: (userData) => api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    getUser: () => api.request('/auth/user'),
    getAllUsers: () => api.request('/auth/users')
  },

  skills: {
    getAll: () => api.request('/skills'),
    getUserSkills: (userId) => api.request(`/skills/user/${userId}`),
    add: (skillData) => api.request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData)
    }),
    delete: (id) => api.request(`/skills/${id}`, { method: 'DELETE' })
  },

  requests: {
    getAll: () => api.request('/requests'),
    create: (data) => api.request('/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, status) => api.request(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    complete: (id) => api.request(`/requests/${id}/complete`, {
      method: 'PUT'
    }),
    stats: () => api.request('/requests/stats')
  },

  messages: {
    getConversation: (userId) => api.request(`/messages/${userId}`),
    send: (data) => api.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    sendWithAttachments: (formData) => api.request('/messages/upload', {
      method: 'POST',
      body: formData
    })
  }
};

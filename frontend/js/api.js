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
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...this.headers(), ...options.headers }
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
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
    })
  },

  messages: {
    getConversation: (userId) => api.request(`/messages/${userId}`),
    send: (data) => api.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
};

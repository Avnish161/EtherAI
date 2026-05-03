/**
 * Etharaai - API Client
 * Centralized Fetch wrapper with JWT auth
 */

class ApiClient {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
  }
  
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
  
  getHeaders(contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      Utils.Toast.error(error.error || 'Request failed');
      throw new Error(error.error || 'Unknown error');
    }
    
    return response.json();
  }
  
  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }
  
  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }
  
  // PUT request
  async put(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }
  
  // DELETE request
  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Delete failed' }));
      Utils.Toast.error(error.error || 'Delete failed');
      throw new Error(error.error);
    }
    return { success: true };
  }
  
  // Auth endpoints
  async register(data) {
    return this.post('/auth/register', data);
  }
  
  async login(data) {
    const result = await this.post('/auth/login', data);
    this.setToken(result.token);
    return result;
  }
  
  async getMe() {
    return this.get('/auth/me');
  }
  
  async logout() {
    this.setToken(null);
    Utils.Toast.success('Logged out successfully');
  }
  
  // Users
  async getUsers() {
    return this.get('/users');
  }
  
  async searchUsers(query) {
    return this.get(`/users/search/${encodeURIComponent(query)}`);
  }
  
  // Projects
  async getProjects() {
    return this.get('/projects');
  }
  
  async createProject(data) {
    return this.post('/projects', data);
  }
  
  async getProject(id) {
    return this.get(`/projects/${id}`);
  }
  
  async updateProject(id, data) {
    return this.put(`/projects/${id}`, data);
  }
  
  async deleteProject(id) {
    return this.delete(`/projects/${id}`);
  }
  
  async addProjectMember(projectId, data) {
    return this.post(`/projects/${projectId}/members`, data);
  }
  
  async removeProjectMember(projectId, userId) {
    return this.delete(`/projects/${projectId}/members/${userId}`);
  }
  
  async getProjectMembers(projectId) {
    return this.get(`/projects/${projectId}/members`);
  }
  
  // Tasks
  async getProjectTasks(projectId) {
    return this.get(`/tasks/project/${projectId}`);
  }
  
  async createTask(projectId, data) {
    return this.post(`/tasks/project/${projectId}`, data);
  }
  
  async getTask(id) {
    return this.get(`/tasks/${id}`);
  }
  
  async updateTask(id, data) {
    return this.put(`/tasks/${id}`, data);
  }
  
  async updateTaskStatus(id, status) {
    return this.put(`/tasks/${id}/status`, { status });
  }
  
  async deleteTask(id) {
    return this.delete(`/tasks/${id}`);
  }
  
  // Dashboard
  async getDashboard() {
    return this.get('/dashboard');
  }
}

// Global API instance
window.API = new ApiClient();


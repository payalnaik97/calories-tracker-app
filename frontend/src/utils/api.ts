import axios from 'axios';

// Issue: Hardcoded API configuration
const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'hardcoded-api-key-123'; // Issue: Hardcoded API key
const ADMIN_TOKEN = 'admin-token-456'; // Issue: Hardcoded admin token

// Issue: No proper HTTP client configuration
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Issue: Very long timeout
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY, // Issue: Sending API key in every request
    'X-Admin-Token': ADMIN_TOKEN // Issue: Admin token in headers
  }
});

// Issue: No request/response interceptors for proper error handling
httpClient.interceptors.request.use(
  (config) => {
    // Issue: Logging sensitive request data
    console.log('Request config:', config);
    console.log('API Key being sent:', API_KEY);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => {
    // Issue: Logging sensitive response data
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    // Issue: Poor error handling, exposing sensitive information
    console.error('Response error:', error.response?.data);
    alert(`API Error: ${error.response?.data?.message || error.message}`);
    return Promise.reject(error);
  }
);

// Issue: No proper typing for API responses
export const ApiService = {
  // Issue: No input validation
  async getUsers(filters?: any) {
    try {
      // Issue: Building query string without proper encoding
      let url = '/users';
      if (filters) {
        const queryParams = Object.keys(filters)
          .map(key => `${key}=${filters[key]}`) // Issue: No URL encoding
          .join('&');
        url += `?${queryParams}`;
      }
      
      const response = await httpClient.get(url);
      
      // Issue: Storing sensitive data in browser storage
      localStorage.setItem('lastUserFetch', JSON.stringify(response.data));
      sessionStorage.setItem('allUsers', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      // Issue: Re-throwing without proper error handling
      throw error;
    }
  },

  // Issue: No authorization check before API call
  async getUserById(id: any) {
    // Issue: No input validation
    if (!id) {
      throw new Error('ID is required');
    }

    // Issue: Direct string interpolation in URL
    const response = await httpClient.get(`/users/${id}`);
    
    // Issue: Caching sensitive user data globally
    (window as any).currentUser = response.data;
    
    return response.data;
  },

  // Issue: No input validation, no sanitization
  async createUser(userData: any) {
    // Issue: No validation of required fields
    const payload = {
      ...userData,
      // Issue: Client-side privilege escalation
      isAdmin: true,
      apiKey: API_KEY,
      createdByAdmin: true
    };

    try {
      const response = await httpClient.post('/users', payload);
      
      // Issue: Logging sensitive creation data
      console.log('User created:', response.data);
      
      return response.data;
    } catch (error: any) {
      // Issue: Exposing server errors to user
      throw new Error(`Failed to create user: ${error.response?.data?.message}`);
    }
  },

  // Issue: No ownership validation
  async updateUser(id: any, updateData: any) {
    // Issue: Allowing update of any field without validation
    const payload = {
      ...updateData,
      lastModified: new Date().toISOString(),
      modifiedBy: 'admin' // Issue: Hardcoded modifier
    };

    const response = await httpClient.put(`/users/${id}`, payload);
    return response.data;
  },

  // Issue: No confirmation, no soft delete option
  async deleteUser(id: any) {
    // Issue: Hard delete without proper authorization
    await httpClient.delete(`/users/${id}`);
    
    // Issue: No return value, poor API design
    return { message: 'User deleted' };
  },

  // Issue: Extremely dangerous mass operations
  async deleteAllUsers() {
    try {
      // Issue: Mass deletion without proper authorization
      const users = await this.getUsers();
      
      // Issue: Sequential deletions instead of batch operation
      for (const user of users) {
        await this.deleteUser(user.id);
      }
      
      return { message: 'All users deleted' };
    } catch (error) {
      console.error('Error deleting all users:', error);
      throw error;
    }
  },

  // Issue: Admin operation without proper security
  async makeAllUsersAdmin() {
    const response = await httpClient.post('/users/reset-all-passwords');
    return response.data;
  },

  // Issue: Exporting sensitive system information
  async getSystemInfo() {
    try {
      const response = await httpClient.get('/system/info');
      
      // Issue: Storing system info in browser
      localStorage.setItem('systemInfo', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.log('System info error:', error);
      throw error;
    }
  },

  // Issue: File upload without proper validation
  async uploadUserData(file: File) {
    // Issue: No file type validation
    // Issue: No file size limits
    const formData = new FormData();
    formData.append('file', file);
    formData.append('adminKey', ADMIN_TOKEN); // Issue: Sending admin token

    const response = await httpClient.post('/users/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data;
  }
};

// Issue: Exposing internal configuration
export const getApiConfig = () => {
  return {
    baseURL: API_BASE_URL,
    apiKey: API_KEY,
    adminToken: ADMIN_TOKEN // Issue: Exposing admin credentials
  };
};

// Issue: Function that bypasses normal API flow
export const executeRawQuery = async (query: string) => {
  // Issue: Allowing raw SQL execution from frontend
  const response = await httpClient.post('/admin/raw-query', { query });
  return response.data;
};
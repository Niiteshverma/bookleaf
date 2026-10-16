import axios from 'axios';

// Base API URL points to the backend server
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');


const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Automatically attach JWT token from localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bookleaf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handler (e.g. handle 401 token expiry)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Token expired or invalid
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('bookleaf_token');
        localStorage.removeItem('bookleaf_user');
        window.location.href = '/login?expired=true';
      }
      return Promise.reject(error.response.data || { message: 'Server error' });
    }
    return Promise.reject({ message: 'Network connection error. Please ensure backend server is running.' });
  }
);

export default axiosClient;

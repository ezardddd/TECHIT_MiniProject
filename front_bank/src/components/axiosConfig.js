import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true
});

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (e) {
    return true;
  }
};

const refreshToken = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post('https://localhost:443/users/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Refresh': refreshToken
      }
    });
    
    if (response.data.ok) {
      const { accessToken: newAccessToken } = response.data.data;
      localStorage.setItem('accessToken', newAccessToken);
      return newAccessToken;
    }
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  }
  return null;
};

instance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (isTokenExpired(token)) {
        const newToken = await refreshToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return instance(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
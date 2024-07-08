import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

let accessToken = null;

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true
});

const isTokenExpired = (token) => {
  if (!token) return true;
  const decodedToken = jwtDecode(token);
  return decodedToken.exp * 1000 < Date.now();
};

const refreshToken = async () => {
  try {
    const response = await axios.post('/api/users/refresh', {}, { withCredentials: true });
    if (response.data.accessToken) {
      accessToken = response.data.accessToken;
      return accessToken;
    }
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    accessToken = null;
  }
  return null;
};

instance.interceptors.request.use(
  async (config) => {
    if (!accessToken || isTokenExpired(accessToken)) {
      accessToken = await refreshToken();
    }
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
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
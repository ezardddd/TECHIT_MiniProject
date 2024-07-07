import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('https://localhost:443/users/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Refresh': refreshToken
          }
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (err) {
        alert(`토큰 갱신 실패: ${err.message}`);
        console.error('토큰 갱신 실패:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        //window.location.href = '/error';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
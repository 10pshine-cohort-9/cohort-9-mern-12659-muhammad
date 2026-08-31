import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Mutable references to auth state and callbacks provided by AuthContext.
 * We use mutable refs here to prevent stale closures in axios interceptors
 * while keeping the reactive access token state inside React AuthContext.
 */
export const authStateRef = {
  getAccessToken: () => null,
  setAccessToken: () => {},
  onLogout: () => {},
};

apiClient.interceptors.request.use(
  (config) => {
    const token = authStateRef.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh or auth endpoints return 401
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_BASE_URL}/api/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then((res) => {
              const newAccessToken = res.data?.data?.accessToken;
              if (newAccessToken) {
                authStateRef.setAccessToken(newAccessToken);
                return newAccessToken;
              }
              throw new Error('Refresh response missing access token');
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        authStateRef.onLogout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

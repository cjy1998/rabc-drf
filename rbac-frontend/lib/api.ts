import axios from "axios";
import { API_BASE_URL } from "./constants";
import { API_ENDPOINTS } from "./constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加授权令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理401错误（令牌失效）
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是401错误并且不是刷新令牌的请求，尝试刷新令牌
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== API_ENDPOINTS.REFRESH_TOKEN
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          // 没有刷新令牌，跳转到登录页
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
          { refresh: refreshToken }
        );

        // 保存新令牌
        localStorage.setItem("access_token", response.data.access);

        // 更新原始请求的授权头
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        // 重试原始请求
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新令牌失败，清除所有令牌并跳转到登录页
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

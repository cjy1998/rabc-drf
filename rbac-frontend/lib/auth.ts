import { jwtDecode } from "jwt-decode";
import api from "./api";
import { API_ENDPOINTS } from "./constants";
import { User } from "@/types";

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await api.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    // 保存令牌到本地存储
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);

    // 保存用户信息
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data.user;
  } catch (error) {
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // 检查令牌是否过期
    if (decoded.exp < currentTime) {
      // 令牌已过期
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const changePassword = async (
  userId: number,
  data: ChangePasswordData
): Promise<void> => {
  await api.post(API_ENDPOINTS.USER_CHANGE_PASSWORD(userId), data);
};

export const API_BASE_URL = "";

export const API_ENDPOINTS = {
  // 认证
  LOGIN: "/api/v1/users/login",
  REFRESH_TOKEN: "/api/v1/token/refresh",

  // 用户
  USERS: "/api/v1/users/",
  USER_CHANGE_PASSWORD: (userId: number) =>
    `/api/v1/users/${userId}/change_password`,

  // 角色
  ROLES: "/api/v1/roles",

  // 权限
  PERMISSIONS: "/api/v1/permissions",

  // 角色权限
  ROLE_PERMISSIONS: "/api/v1/role-permissions",

  // 用户角色
  USER_ROLES: "/api/v1/user-roles",
};

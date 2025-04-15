"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  User,
  Role,
  UserRole,
  PaginationParams,
  PaginatedResponse,
} from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";

// 用户表单验证模式
const userFormSchema = z.object({
  username: z.string().min(2, { message: "用户名至少2个字符" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(8, { message: "密码至少8个字符" }),
  roles: z.array(z.number()).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<User>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 初始化表单
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      roles: [],
    },
  });

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<User>>(
        `${API_ENDPOINTS.USERS}?page=${pagination.page}&page_size=${pagination.page_size}`
      );
      setUsers(response.data);
    } catch (error: any) {
      console.error("获取用户列表失败:", error);
      toast.error(error.response?.data?.detail || "获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await api.get<PaginatedResponse<Role>>(
        API_ENDPOINTS.ROLES
      );
      setRoles(response.data.results);
    } catch (error: any) {
      console.error("获取角色列表失败:", error);
      toast.error(error.response?.data?.detail || "获取角色列表失败");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [pagination.page, pagination.page_size]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // 角色选择状态切换
  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });

    // 更新表单中的角色数组
    const currentRoles = form.getValues("roles") || [];
    if (currentRoles.includes(roleId)) {
      form.setValue(
        "roles",
        currentRoles.filter((id) => id !== roleId)
      );
    } else {
      form.setValue("roles", [...currentRoles, roleId]);
    }
  };

  // 创建用户
  const createUser = async (data: UserFormValues) => {
    try {
      // 先创建用户
      const userResponse = await api.post(API_ENDPOINTS.USERS, {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
      });

      const userId = userResponse.data.id;

      // 如果选择了角色，为用户分配角色
      if (data.roles && data.roles.length > 0) {
        const rolePromises = data.roles.map((roleId) =>
          api.post(API_ENDPOINTS.USER_ROLES, {
            user: userId,
            role: roleId,
          })
        );

        await Promise.all(rolePromises);
      }

      toast.success("用户创建成功");
      setIsDialogOpen(false);
      form.reset();
      setSelectedRoles([]);
      fetchUsers(); // 刷新用户列表
    } catch (error: any) {
      console.error("创建用户失败:", error);
      toast.error(error.response?.data?.detail || "创建用户失败");
    }
  };

  // 删除用户
  const deleteUser = async (userId: number) => {
    if (!confirm("确定要删除此用户吗？")) return;

    try {
      await api.delete(`${API_ENDPOINTS.USERS}${userId}/`);
      toast.success("用户删除成功");
      fetchUsers(); // 刷新用户列表
    } catch (error: any) {
      console.error("删除用户失败:", error);
      toast.error(error.response?.data?.detail || "删除用户失败");
    }
  };

  // 打开编辑用户对话框
  const openEditDialog = (user: User) => {
    setEditingUser(user);

    // 获取用户当前角色
    const userRoles: number[] =
      user.roles?.map((role: UserRole) => role.role) || [];
    setSelectedRoles(userRoles);

    // 设置表单值
    form.reset({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      roles: userRoles,
    });
    setIsEditDialogOpen(true);
  };

  // 更新用户
  const updateUser = async (data: UserFormValues) => {
    if (!editingUser) return;

    try {
      // 更新用户基本信息（不包括密码，因为后端可能有单独的密码修改接口）
      const updateData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      };

      if (data.password && data.password.trim() !== "") {
        Object.assign(updateData, { password: data.password });
      }

      await api.put(`${API_ENDPOINTS.USERS}${editingUser.id}/`, updateData);

      // 如果选择了角色，为用户更新角色
      if (data.roles) {
        // 获取用户当前角色
        const userRolesResponse = await api.get(
          `${API_ENDPOINTS.USER_ROLES}?user=${editingUser.id}`
        );
        const currentUserRoles = userRolesResponse.data.results;

        // 需要删除的角色关联
        const toDelete = currentUserRoles
          .filter((ur: any) => !data.roles?.includes(ur.role))
          .map((ur: any) => ur.id);

        // 需要添加的角色
        const existingRoles = currentUserRoles.map((ur: any) => ur.role);
        const toAdd = data.roles
          .filter((roleId) => !existingRoles.includes(roleId))
          .map((roleId) => ({
            user: editingUser.id,
            role: roleId,
          }));

        // 删除不需要的角色关联
        const deletePromises = toDelete.map((id: number) =>
          api.delete(`${API_ENDPOINTS.USER_ROLES}${id}/`)
        );

        // 添加新的角色关联
        const addPromises = toAdd.map((data: any) =>
          api.post(API_ENDPOINTS.USER_ROLES, data)
        );

        await Promise.all([...deletePromises, ...addPromises]);
      }

      toast.success("用户更新成功");
      setIsEditDialogOpen(false);
      form.reset();
      setEditingUser(null);
      setSelectedRoles([]);
      fetchUsers(); // 刷新用户列表
    } catch (error: any) {
      console.error("更新用户失败:", error);
      toast.error(error.response?.data?.detail || "更新用户失败");
    }
  };

  // 提交表单处理
  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      updateUser(data);
    } else {
      createUser(data);
    }
  };

  // @ts-ignore
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>新增用户</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>创建新用户</DialogTitle>
                  <DialogDescription>填写以下信息创建新用户</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入用户名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>邮箱</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="请输入邮箱"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>名</FormLabel>
                            <FormControl>
                              <Input placeholder="名" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>姓</FormLabel>
                            <FormControl>
                              <Input placeholder="姓" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="请输入密码"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>角色分配</FormLabel>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center space-x-2 py-1"
                            >
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={selectedRoles.includes(role.id)}
                                onCheckedChange={() => toggleRole(role.id)}
                              />
                              <label
                                htmlFor={`role-${role.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {role.name}
                                <p className="text-xs text-muted-foreground">
                                  {role.description}
                                </p>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-center py-2">
                            暂无角色可选
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">创建用户</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* 编辑用户对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>编辑用户</DialogTitle>
                  <DialogDescription>修改用户信息</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入用户名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>邮箱</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="请输入邮箱"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>名</FormLabel>
                            <FormControl>
                              <Input placeholder="名" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>姓</FormLabel>
                            <FormControl>
                              <Input placeholder="姓" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>密码 (留空则不修改)</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="请输入新密码或留空"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-2">
                      <FormLabel>角色分配</FormLabel>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center space-x-2 py-1"
                            >
                              <Checkbox
                                id={`edit-role-${role.id}`}
                                checked={selectedRoles.includes(role.id)}
                                onCheckedChange={() => toggleRole(role.id)}
                              />
                              <label
                                htmlFor={`edit-role-${role.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {role.name}
                                <p className="text-xs text-muted-foreground">
                                  {role.description}
                                </p>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-center py-2">
                            暂无角色可选
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">保存修改</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">加载中...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>用户名</TableHead>
                        <TableHead>邮箱</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>注册时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            暂无用户数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.results.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>
                              {user.is_active ? (
                                <span className="text-green-600">激活</span>
                              ) : (
                                <span className="text-red-600">禁用</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.date_joined).toLocaleString()}
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteUser(user.id)}
                              >
                                删除
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="mt-4">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={Math.ceil(users.count / pagination.page_size)}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

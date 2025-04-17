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
  Role,
  Permission,
  RolePermission,
  PaginationParams,
  PaginatedResponse,
} from "@/types";
import { Pagination } from "@/components/ui/pagination";

// 角色表单验证模式
const roleFormSchema = z.object({
  name: z.string().min(2, { message: "角色名称至少2个字符" }),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function RolesPage() {
  const [roles, setRoles] = useState<PaginatedResponse<Role>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 10,
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionPagination, setPermissionPagination] =
    useState<PaginationParams>({
      page: 1,
      page_size: 10,
    });
  const [paginatedPermissions, setPaginatedPermissions] = useState<{
    items: Permission[];
    totalPages: number;
  }>({
    items: [],
    totalPages: 1,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // 初始化表单
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Role>>(
        `${API_ENDPOINTS.ROLES}?page=${pagination.page}&page_size=${pagination.page_size}`
      );
      setRoles(response.data);
    } catch (error: any) {
      console.error("获取角色列表失败:", error);
      toast.error(error.response?.data?.detail || "获取角色列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const response = await api.get<PaginatedResponse<Permission>>(
        `${API_ENDPOINTS.PERMISSIONS}?page=1&page_size=100`
      );
      setPermissions(response.data.results);
    } catch (error: any) {
      console.error("获取权限列表失败:", error);
      toast.error(error.response?.data?.detail || "获取权限列表失败");
    }
  };

  // 获取角色权限列表
  const fetchRolePermissions = async () => {
    try {
      const response = await api.get<RolePermission[]>(
        API_ENDPOINTS.ROLE_PERMISSIONS
      );
      setRolePermissions(response.data);
    } catch (error: any) {
      console.error("获取角色权限列表失败:", error);
      toast.error(error.response?.data?.detail || "获取角色权限列表失败");
    }
  };

  // 计算当前页的权限
  const updatePaginatedPermissions = () => {
    if (permissions.length === 0) return;

    const startIndex =
      (permissionPagination.page - 1) * permissionPagination.page_size;
    const endIndex = startIndex + permissionPagination.page_size;
    const items = permissions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(
      permissions.length / permissionPagination.page_size
    );

    setPaginatedPermissions({
      items,
      totalPages,
    });
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchRolePermissions();
  }, [pagination.page, pagination.page_size]);

  useEffect(() => {
    updatePaginatedPermissions();
  }, [permissions, permissionPagination.page, permissionPagination.page_size]);

  // 创建角色
  const createRole = async (data: RoleFormValues) => {
    try {
      await api.post(API_ENDPOINTS.ROLES, data);
      toast.success("角色创建成功");
      setIsCreateDialogOpen(false);
      form.reset();
      fetchRoles(); // 刷新角色列表
    } catch (error: any) {
      console.error("创建角色失败:", error);
      toast.error(error.response?.data?.detail || "创建角色失败");
    }
  };

  // 打开编辑角色对话框
  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    // 设置表单值
    form.reset({
      name: role.name,
      description: role.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // 更新角色
  const updateRole = async (data: RoleFormValues) => {
    if (!editingRole) return;

    try {
      await api.put(`${API_ENDPOINTS.ROLES}${editingRole.id}/`, data);
      toast.success("角色更新成功");
      setIsEditDialogOpen(false);
      form.reset();
      setEditingRole(null);
      fetchRoles(); // 刷新角色列表
    } catch (error: any) {
      console.error("更新角色失败:", error);
      toast.error(error.response?.data?.detail || "更新角色失败");
    }
  };

  // 提交表单处理
  const onSubmit = (data: RoleFormValues) => {
    if (editingRole) {
      updateRole(data);
    } else {
      createRole(data);
    }
  };

  // 删除角色
  const deleteRole = async (roleId: number) => {
    toast.custom(
      (t) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">确认删除</h3>
          <p className="text-muted-foreground mb-6">
            确定要删除此角色吗？此操作无法撤销。
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss(t)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                toast.dismiss(t);
                try {
                  await api.delete(`${API_ENDPOINTS.ROLES}${roleId}/`);
                  toast.success("角色删除成功");
                  fetchRoles(); // 刷新角色列表
                  fetchRolePermissions(); // 刷新角色权限列表
                } catch (error: any) {
                  console.error("删除角色失败:", error);
                  toast.error(error.response?.data?.detail || "删除角色失败");
                }
              }}
            >
              确认删除
            </Button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  // 打开权限设置对话框
  const openPermissionDialog = (role: Role) => {
    setSelectedRole(role);
    setPermissionPagination({ page: 1, page_size: 10 }); // 重置权限分页到第一页

    // 获取当前角色的权限
    const currentPermissions = rolePermissions.results
      .filter((rp) => rp.role === role.id)
      .map((rp) => rp.permission);

    setSelectedPermissions(currentPermissions);
    setIsPermissionDialogOpen(true);

    // 立即更新分页权限数据
    const startIndex = 0; // 第一页从0开始
    const endIndex = startIndex + permissionPagination.page_size;
    const items = permissions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(
      permissions.length / permissionPagination.page_size
    );

    setPaginatedPermissions({
      items,
      totalPages,
    });
  };

  // 权限选择状态切换
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // 保存角色权限
  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      // 获取当前角色的所有权限关联
      const currentRolePermissions = rolePermissions.results.filter(
        (rp) => rp.role === selectedRole.id
      );

      // 需要删除的权限关联
      const toDelete = currentRolePermissions
        .filter((rp) => !selectedPermissions.includes(rp.permission))
        .map((rp) => rp.id);

      // 需要添加的权限
      const existingPermissions = currentRolePermissions.map(
        (rp) => rp.permission
      );
      const toAdd = selectedPermissions
        .filter((permId) => !existingPermissions.includes(permId))
        .map((permId) => ({
          role: selectedRole.id,
          permission: permId,
        }));

      // 删除不需要的权限关联
      const deletePromises = toDelete.map((id) =>
        api.delete(`${API_ENDPOINTS.ROLE_PERMISSIONS}${id}/`)
      );

      // 添加新的权限关联
      const addPromises = toAdd.map((data) =>
        api.post(API_ENDPOINTS.ROLE_PERMISSIONS, data)
      );

      await Promise.all([...deletePromises, ...addPromises]);

      toast.success("角色权限更新成功");
      setIsPermissionDialogOpen(false);
      fetchRolePermissions(); // 刷新角色权限列表
    } catch (error: any) {
      console.error("更新角色权限失败:", error);
      toast.error(error.response?.data?.detail || "更新角色权限失败");
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePermissionPageChange = (page: number) => {
    setPermissionPagination((prev) => ({ ...prev, page }));
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">角色管理</h1>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>新增角色</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新角色</DialogTitle>
                  <DialogDescription>填写以下信息创建新角色</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>角色名称</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入角色名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>描述</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入角色描述" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">创建角色</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* 编辑角色对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑角色</DialogTitle>
                  <DialogDescription>修改角色信息</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>角色名称</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入角色名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>描述</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入角色描述" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
              <CardTitle>角色列表</CardTitle>
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
                        <TableHead>名称</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            暂无角色数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        roles.results.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>{role.id}</TableCell>
                            <TableCell>{role.name}</TableCell>
                            <TableCell>{role.description}</TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPermissionDialog(role)}
                              >
                                设置权限
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(role)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteRole(role.id)}
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
                      totalPages={Math.ceil(roles.count / pagination.page_size)}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 权限设置对话框 */}
        <Dialog
          open={isPermissionDialogOpen}
          onOpenChange={setIsPermissionDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>设置角色权限</DialogTitle>
              <DialogDescription>
                {selectedRole
                  ? `为角色 "${selectedRole.name}" 设置权限`
                  : "设置权限"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-[40vh] overflow-y-auto border rounded-md p-3">
                {paginatedPermissions.items.length === 0 ? (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    暂无权限数据
                  </div>
                ) : (
                  paginatedPermissions.items.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2 py-2 border-b last:border-0"
                    >
                      <input
                        type="checkbox"
                        id={`perm-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label
                        htmlFor={`perm-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                      >
                        {permission.name}
                        <p className="text-xs text-muted-foreground mt-1">
                          {permission.description}
                        </p>
                      </label>
                    </div>
                  ))
                )}
              </div>

              {paginatedPermissions.totalPages > 1 && (
                <div className="flex justify-center mt-2">
                  <Pagination
                    currentPage={permissionPagination.page}
                    totalPages={paginatedPermissions.totalPages}
                    onPageChange={handlePermissionPageChange}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={saveRolePermissions}>保存权限设置</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

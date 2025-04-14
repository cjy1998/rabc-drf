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
      const response = await api.get<Permission[]>(API_ENDPOINTS.PERMISSIONS);
      console.log("获取权限列表成功:", response.data);
      setPermissions(response.data);
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

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchRolePermissions();
  }, [pagination.page, pagination.page_size]);

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

  // 删除角色
  const deleteRole = async (roleId: number) => {
    if (!confirm("确定要删除此角色吗？")) return;

    try {
      await api.delete(`${API_ENDPOINTS.ROLES}${roleId}/`);
      toast.success("角色删除成功");
      fetchRoles(); // 刷新角色列表
      fetchRolePermissions(); // 刷新角色权限列表
    } catch (error: any) {
      console.error("删除角色失败:", error);
      toast.error(error.response?.data?.detail || "删除角色失败");
    }
  };

  // 打开权限设置对话框
  const openPermissionDialog = (role: Role) => {
    setSelectedRole(role);

    // 获取当前角色的权限
    const currentPermissions = rolePermissions
      .filter((rp) => rp.role === role.id)
      .map((rp) => rp.permission);

    setSelectedPermissions(currentPermissions);
    setIsPermissionDialogOpen(true);
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
      const currentRolePermissions = rolePermissions.filter(
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
                    onSubmit={form.handleSubmit(createRole)}
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
            <div className="max-h-[60vh] overflow-y-auto grid gap-2">
              {/*{permissions.results.map((permission) => (*/}
              {/*  <div*/}
              {/*    key={permission.id}*/}
              {/*    className="flex items-center space-x-2"*/}
              {/*  >*/}
              {/*    <input*/}
              {/*      type="checkbox"*/}
              {/*      id={`perm-${permission.id}`}*/}
              {/*      checked={selectedPermissions.includes(permission.id)}*/}
              {/*      onChange={() => togglePermission(permission.id)}*/}
              {/*      className="rounded border-gray-300 text-primary focus:ring-primary"*/}
              {/*    />*/}
              {/*    <label*/}
              {/*      htmlFor={`perm-${permission.id}`}*/}
              {/*      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"*/}
              {/*    >*/}
              {/*      {permission.name}*/}
              {/*      <p className="text-xs text-gray-500">*/}
              {/*        {permission.description}*/}
              {/*      </p>*/}
              {/*    </label>*/}
              {/*  </div>*/}
              {/*))}*/}
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

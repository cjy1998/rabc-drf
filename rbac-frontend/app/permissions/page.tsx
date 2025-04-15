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
import { Permission, PaginationParams, PaginatedResponse } from "@/types";
import { Pagination } from "@/components/ui/pagination";

// 权限表单验证模式
const permissionFormSchema = z.object({
  name: z.string().min(2, { message: "权限名称至少2个字符" }),
  codename: z.string().min(2, { message: "权限代码至少2个字符" }),
  description: z.string().optional(),
});

type PermissionFormValues = z.infer<typeof permissionFormSchema>;

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PaginatedResponse<Permission>>(
    {
      count: 0,
      next: null,
      previous: null,
      results: [],
    }
  );
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );

  // 初始化表单
  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      name: "",
      codename: "",
      description: "",
    },
  });

  // 获取权限列表
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Permission>>(
        `${API_ENDPOINTS.PERMISSIONS}?page=${pagination.page}&page_size=${pagination.page_size}`
      );
      setPermissions(response.data);
    } catch (error: any) {
      console.error("获取权限列表失败:", error);
      toast.error(error.response?.data?.detail || "获取权限列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [pagination.page, pagination.page_size]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // 创建权限
  const createPermission = async (data: PermissionFormValues) => {
    try {
      await api.post(API_ENDPOINTS.PERMISSIONS, data);
      toast.success("权限创建成功");
      setIsDialogOpen(false);
      form.reset();
      fetchPermissions(); // 刷新权限列表
    } catch (error: any) {
      console.error("创建权限失败:", error);
      toast.error(error.response?.data?.detail || "创建权限失败");
    }
  };

  // 删除权限
  const deletePermission = async (permissionId: number) => {
    if (!confirm("确定要删除此权限吗？")) return;

    try {
      await api.delete(`${API_ENDPOINTS.PERMISSIONS}${permissionId}/`);
      toast.success("权限删除成功");
      fetchPermissions(); // 刷新权限列表
    } catch (error: any) {
      console.error("删除权限失败:", error);
      toast.error(error.response?.data?.detail || "删除权限失败");
    }
  };

  // 打开编辑权限对话框
  const openEditDialog = (permission: Permission) => {
    setEditingPermission(permission);
    // 设置表单值
    form.reset({
      name: permission.name,
      codename: permission.codename,
      description: permission.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // 更新权限
  const updatePermission = async (data: PermissionFormValues) => {
    if (!editingPermission) return;

    try {
      await api.put(
        `${API_ENDPOINTS.PERMISSIONS}${editingPermission.id}/`,
        data
      );
      toast.success("权限更新成功");
      setIsEditDialogOpen(false);
      form.reset();
      setEditingPermission(null);
      fetchPermissions(); // 刷新权限列表
    } catch (error: any) {
      console.error("更新权限失败:", error);
      toast.error(error.response?.data?.detail || "更新权限失败");
    }
  };

  // 提交表单处理
  const onSubmit = (data: PermissionFormValues) => {
    if (editingPermission) {
      updatePermission(data);
    } else {
      createPermission(data);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">权限管理</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>新增权限</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新权限</DialogTitle>
                  <DialogDescription>填写以下信息创建新权限</DialogDescription>
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
                          <FormLabel>权限名称</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入权限名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>权限代码</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入权限代码" {...field} />
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
                            <Input placeholder="请输入权限描述" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">创建权限</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* 编辑权限对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑权限</DialogTitle>
                  <DialogDescription>修改权限信息</DialogDescription>
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
                          <FormLabel>权限名称</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入权限名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>权限代码</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入权限代码" {...field} />
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
                            <Input placeholder="请输入权限描述" {...field} />
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
              <CardTitle>权限列表</CardTitle>
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
                        <TableHead>代码</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            暂无权限数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        permissions.results.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>{permission.id}</TableCell>
                            <TableCell>{permission.name}</TableCell>
                            <TableCell>{permission.codename}</TableCell>
                            <TableCell>{permission.description}</TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(permission)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deletePermission(permission.id)}
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
                      totalPages={Math.ceil(
                        permissions.count / pagination.page_size
                      )}
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

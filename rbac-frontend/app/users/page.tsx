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
import { User, PaginationParams, PaginatedResponse } from "@/types";
import { Pagination } from "@/components/ui/pagination";

// 用户表单验证模式
const userFormSchema = z.object({
  username: z.string().min(2, { message: "用户名至少2个字符" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(8, { message: "密码至少8个字符" }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<User>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 初始化表单
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
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

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.page_size]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // 创建用户
  const createUser = async (data: UserFormValues) => {
    try {
      await api.post(API_ENDPOINTS.USERS, data);
      toast.success("用户创建成功");
      setIsDialogOpen(false);
      form.reset();
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新用户</DialogTitle>
                  <DialogDescription>填写以下信息创建新用户</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(createUser)}
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
                    <DialogFooter>
                      <Button type="submit">创建用户</Button>
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
                            <TableCell>
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

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
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { Tag, PaginationParams, PaginatedResponse } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 标签表单验证模式
const tagFormSchema = z.object({
  name: z.string().min(2, { message: "标签名称至少2个字符" }),
  slug: z.string().min(2, { message: "标签别名至少2个字符" }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "请输入有效的十六进制颜色值，如 #FF5733",
  }),
  parent_id: z.number().nullable(),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

export default function TagsPage() {
  const [tags, setTags] = useState<PaginatedResponse<Tag>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [allTags, setAllTags] = useState<Tag[]>([]); // 存储所有标签以供选择父标签
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    page_size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // 初始化表单
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      color: "#6366F1",
      parent_id: null,
    },
  });

  // 获取标签列表
  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Tag>>(
        `${API_ENDPOINTS.TAGS}?page=${pagination.page}&page_size=${pagination.page_size}`
      );
      setTags(response.data);

      // 获取所有标签（用于父标签选择）
      const allTagsResponse = await api.get<PaginatedResponse<Tag>>(
        `${API_ENDPOINTS.TAGS}?page=1&page_size=100`
      );
      setAllTags(allTagsResponse.data.results);
    } catch (error: any) {
      console.error("获取标签列表失败:", error);
      toast.error(error.response?.data?.detail || "获取标签列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [pagination.page, pagination.page_size]);

  // 创建标签
  const createTag = async (data: TagFormValues) => {
    try {
      await api.post(API_ENDPOINTS.TAGS, data);
      toast.success("标签创建成功");
      setIsCreateDialogOpen(false);
      form.reset();
      fetchTags(); // 刷新标签列表
    } catch (error: any) {
      console.error("创建标签失败:", error);
      toast.error(error.response?.data?.detail || "创建标签失败");
    }
  };

  // 打开编辑标签对话框
  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    // 设置表单值
    form.reset({
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      parent_id: tag.parent_id,
    });
    setIsEditDialogOpen(true);
  };

  // 更新标签
  const updateTag = async (data: TagFormValues) => {
    if (!editingTag) return;

    try {
      await api.put(`${API_ENDPOINTS.TAGS}${editingTag.id}/`, data);
      toast.success("标签更新成功");
      setIsEditDialogOpen(false);
      form.reset();
      setEditingTag(null);
      fetchTags(); // 刷新标签列表
    } catch (error: any) {
      console.error("更新标签失败:", error);
      toast.error(error.response?.data?.detail || "更新标签失败");
    }
  };

  // 提交表单处理
  const onSubmit = (data: TagFormValues) => {
    if (editingTag) {
      updateTag(data);
    } else {
      createTag(data);
    }
  };

  // 删除标签
  const deleteTag = async (tagId: number) => {
    toast.custom(
      (t) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">确认删除</h3>
          <p className="text-muted-foreground mb-6">
            确定要删除此标签吗？此操作无法撤销。
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
                  await api.delete(`${API_ENDPOINTS.TAGS}${tagId}/`);
                  toast.success("标签删除成功");
                  fetchTags(); // 刷新标签列表
                } catch (error: any) {
                  console.error("删除标签失败:", error);
                  toast.error(error.response?.data?.detail || "删除标签失败");
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

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // 获取标签的父标签名称
  const getParentTagName = (parentId: number | null) => {
    if (!parentId) return "无";
    const parent = allTags.find((tag) => tag.id === parentId);
    return parent ? parent.name : "未知";
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">标签管理</h1>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>新增标签</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新标签</DialogTitle>
                  <DialogDescription>填写以下信息创建新标签</DialogDescription>
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
                          <FormLabel>名称</FormLabel>
                          <FormControl>
                            <Input placeholder="输入标签名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标识符</FormLabel>
                          <FormControl>
                            <Input placeholder="输入标签标识符" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parent_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>父标签</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value ? parseInt(value, 10) : null)
                            }
                            value={field.value?.toString() || "null"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择父标签（可选）" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">无</SelectItem>
                              {allTags
                                .filter(
                                  (tag) =>
                                    !editingTag || tag.id !== editingTag.id
                                ) // 排除自己
                                .map((tag) => (
                                  <SelectItem
                                    key={tag.id}
                                    value={tag.id.toString()}
                                  >
                                    {tag.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>颜色</FormLabel>
                          <div className="flex space-x-2 items-center">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="#FF5733"
                                {...field}
                              />
                            </FormControl>
                            <Input
                              type="color"
                              className="w-12 h-10 p-1"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">保存</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* 编辑标签对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑标签</DialogTitle>
                  <DialogDescription>修改标签信息</DialogDescription>
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
                          <FormLabel>名称</FormLabel>
                          <FormControl>
                            <Input placeholder="输入标签名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标识符</FormLabel>
                          <FormControl>
                            <Input placeholder="输入标签标识符" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parent_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>父标签</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(value ? parseInt(value, 10) : null)
                            }
                            value={field.value?.toString() || "null"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择父标签（可选）" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">无</SelectItem>
                              {allTags
                                .filter(
                                  (tag) =>
                                    !editingTag || tag.id !== editingTag.id
                                ) // 排除自己
                                .map((tag) => (
                                  <SelectItem
                                    key={tag.id}
                                    value={tag.id.toString()}
                                  >
                                    {tag.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>颜色</FormLabel>
                          <div className="flex space-x-2 items-center">
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="#FF5733"
                                {...field}
                              />
                            </FormControl>
                            <Input
                              type="color"
                              className="w-12 h-10 p-1"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">更新</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>标签列表</CardTitle>
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
                        <TableHead>标识符</TableHead>
                        <TableHead>父标签</TableHead>
                        <TableHead>颜色</TableHead>
                        <TableHead>创建时间</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            暂无标签数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        tags.results.map((tag) => (
                          <TableRow key={tag.id}>
                            <TableCell>{tag.id}</TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: tag.color }}>
                                {tag.name}
                              </Badge>
                            </TableCell>
                            <TableCell>{tag.slug}</TableCell>
                            <TableCell>
                              {getParentTagName(tag.parent_id)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-6 h-6 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span>{tag.color}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(tag.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(tag)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteTag(tag.id)}
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
                      totalPages={Math.ceil(tags.count / pagination.page_size)}
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

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { Link, Tag, PaginationParams, PaginatedResponse } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";

// 链接表单验证模式
const linkFormSchema = z.object({
  title: z.string().min(2, { message: "标题至少2个字符" }),
  url: z.string().url({ message: "请输入有效的URL" }),
  description: z.string().optional(),
  tags: z.array(z.number()).default([]),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

export default function LinksPage() {
  const [links, setLinks] = useState<PaginatedResponse<Link>>({
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // 初始化表单
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      tags: [],
    },
  });

  // 获取链接列表
  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Link>>(
        `${API_ENDPOINTS.LINKS}?page=${pagination.page}&page_size=${pagination.page_size}`
      );
      setLinks(response.data);
    } catch (error: any) {
      console.error("获取链接列表失败:", error);
      toast.error(error.response?.data?.detail || "获取链接列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取标签列表
  const fetchTags = async () => {
    try {
      const response = await api.get<PaginatedResponse<Tag>>(
        `${API_ENDPOINTS.TAGS}?page=1&page_size=100`
      );
      setTags(response.data.results);
    } catch (error: any) {
      console.error("获取标签列表失败:", error);
      toast.error(error.response?.data?.detail || "获取标签列表失败");
    }
  };

  useEffect(() => {
    fetchLinks();
    fetchTags();
  }, [pagination.page, pagination.page_size]);

  // 创建链接
  const createLink = async (data: LinkFormValues) => {
    try {
      const response = await api.post(API_ENDPOINTS.LINKS, data);

      // 如果选择了标签，为链接添加标签
      if (data.tags.length > 0) {
        const linkId = response.data.id;
        const tagPromises = data.tags.map((tagId) =>
          api.post(`${API_ENDPOINTS.LINKS}${linkId}/add_tag/`, {
            tag_id: tagId,
          })
        );
        await Promise.all(tagPromises);
      }

      toast.success("链接创建成功");
      setIsCreateDialogOpen(false);
      form.reset();
      fetchLinks(); // 刷新链接列表
    } catch (error: any) {
      console.error("创建链接失败:", error);
      toast.error(error.response?.data?.detail || "创建链接失败");
    }
  };

  // 打开编辑链接对话框
  const openEditDialog = (link: Link) => {
    setEditingLink(link);

    // 提取当前链接的标签ID
    const linkTagIds = link.tags?.map((tag) => tag.id) || [];
    setSelectedTags(linkTagIds);

    // 设置表单值
    form.reset({
      title: link.title,
      url: link.url,
      description: link.description || "",
      tags: linkTagIds,
    });

    setIsEditDialogOpen(true);
  };

  // 更新链接
  const updateLink = async (data: LinkFormValues) => {
    if (!editingLink) return;

    try {
      // 更新基本信息
      await api.put(`${API_ENDPOINTS.LINKS}${editingLink.id}/`, {
        title: data.title,
        url: data.url,
        description: data.description,
      });

      // 获取当前链接的标签
      const currentTags = editingLink.tags?.map((tag) => tag.id) || [];

      // 找出需要添加的标签
      const tagsToAdd = data.tags.filter(
        (tagId) => !currentTags.includes(tagId)
      );

      // 找出需要删除的标签
      const tagsToRemove = currentTags.filter(
        (tagId) => !data.tags.includes(tagId)
      );

      // 添加新标签
      const addPromises = tagsToAdd.map((tagId) =>
        api.post(`${API_ENDPOINTS.LINKS}${editingLink.id}/add_tag/`, {
          tag_id: tagId,
        })
      );

      // 删除旧标签
      const removePromises = tagsToRemove.map((tagId) =>
        api.post(`${API_ENDPOINTS.LINKS}${editingLink.id}/remove_tag/`, {
          tag_id: tagId,
        })
      );

      await Promise.all([...addPromises, ...removePromises]);

      toast.success("链接更新成功");
      setIsEditDialogOpen(false);
      form.reset();
      setEditingLink(null);
      fetchLinks(); // 刷新链接列表
    } catch (error: any) {
      console.error("更新链接失败:", error);
      toast.error(error.response?.data?.detail || "更新链接失败");
    }
  };

  // 处理标签选择状态变化
  const handleTagChange = (tagId: number, checked: boolean) => {
    if (checked) {
      form.setValue("tags", [...form.getValues("tags"), tagId]);
    } else {
      form.setValue(
        "tags",
        form.getValues("tags").filter((id) => id !== tagId)
      );
    }
  };

  // 提交表单处理
  const onSubmit = (data: LinkFormValues) => {
    if (editingLink) {
      updateLink(data);
    } else {
      createLink(data);
    }
  };

  // 删除链接
  const deleteLink = async (linkId: number) => {
    toast.custom(
      (t) => (
        <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">确认删除</h3>
          <p className="text-muted-foreground mb-6">
            确定要删除此链接吗？此操作无法撤销。
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
                  await api.delete(`${API_ENDPOINTS.LINKS}${linkId}/`);
                  toast.success("链接删除成功");
                  fetchLinks(); // 刷新链接列表
                } catch (error: any) {
                  console.error("删除链接失败:", error);
                  toast.error(error.response?.data?.detail || "删除链接失败");
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">链接管理</h1>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>新增链接</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新链接</DialogTitle>
                  <DialogDescription>填写以下信息创建新链接</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标题</FormLabel>
                          <FormControl>
                            <Input placeholder="输入链接标题" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input placeholder="输入链接URL" {...field} />
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
                            <Textarea
                              placeholder="输入链接描述"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>标签</FormLabel>
                          <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                            {tags.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                暂无标签数据
                              </div>
                            ) : (
                              tags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tag-${tag.id}`}
                                    checked={form
                                      .getValues("tags")
                                      .includes(tag.id)}
                                    onCheckedChange={(checked) =>
                                      handleTagChange(
                                        tag.id,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`tag-${tag.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                  >
                                    <Badge
                                      style={{ backgroundColor: tag.color }}
                                      className="px-2 py-0.5"
                                    >
                                      {tag.name}
                                    </Badge>
                                  </label>
                                </div>
                              ))
                            )}
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

            {/* 编辑链接对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑链接</DialogTitle>
                  <DialogDescription>修改链接信息</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>标题</FormLabel>
                          <FormControl>
                            <Input placeholder="输入链接标题" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input placeholder="输入链接URL" {...field} />
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
                            <Textarea
                              placeholder="输入链接描述"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>标签</FormLabel>
                          <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                            {tags.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                暂无标签数据
                              </div>
                            ) : (
                              tags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`edit-tag-${tag.id}`}
                                    checked={form
                                      .getValues("tags")
                                      .includes(tag.id)}
                                    onCheckedChange={(checked) =>
                                      handleTagChange(
                                        tag.id,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`edit-tag-${tag.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                  >
                                    <Badge
                                      style={{ backgroundColor: tag.color }}
                                      className="px-2 py-0.5"
                                    >
                                      {tag.name}
                                    </Badge>
                                  </label>
                                </div>
                              ))
                            )}
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
              <CardTitle>链接列表</CardTitle>
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
                        <TableHead>标题</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>标签</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {links.results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            暂无链接数据
                          </TableCell>
                        </TableRow>
                      ) : (
                        links.results.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>{link.id}</TableCell>
                            <TableCell>{link.title}</TableCell>
                            <TableCell>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {link.url.length > 30
                                  ? link.url.substring(0, 30) + "..."
                                  : link.url}
                              </a>
                            </TableCell>
                            <TableCell>{link.description}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {link.tags?.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(link)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteLink(link.id)}
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
                      totalPages={Math.ceil(links.count / pagination.page_size)}
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

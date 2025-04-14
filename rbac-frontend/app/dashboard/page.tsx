"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { User, Role, Permission } from "@/types";
import {useRouter} from "next/navigation";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    usersCount: 0,
    rolesCount: 0,
    permissionsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, rolesRes, permissionsRes] = await Promise.all([
          api.get<User[]>(API_ENDPOINTS.USERS),
          api.get<Role[]>(API_ENDPOINTS.ROLES),
          api.get<Permission[]>(API_ENDPOINTS.PERMISSIONS),
        ]);

        setStats({
          usersCount: usersRes.data.count,
          rolesCount: rolesRes.data.count,
          permissionsCount: permissionsRes.data.count,
        });
      } catch (error) {
        console.error("获取统计数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  const router = useRouter()
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
          <p className="text-muted-foreground">系统整体状态信息和数据概览</p>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">用户</CardTitle>
                <CardDescription>系统中的用户总数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold cursor-pointer" onClick={() => router.push('/users')}>
                  {loading ? "加载中..." : stats.usersCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">角色</CardTitle>
                <CardDescription>系统中的角色总数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold cursor-pointer" onClick={() => router.push('/roles')}>
                  {loading ? "加载中..." : stats.rolesCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">权限</CardTitle>
                <CardDescription>系统中的权限总数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold cursor-pointer" onClick={() => router.push('/permissions')}>
                  {loading ? "加载中..." : stats.permissionsCount}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

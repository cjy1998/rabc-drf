import React, { ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = getCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-4 mx-auto">
          {/* 移动端汉堡菜单图标 */}
          <div className="md:hidden mr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="菜单"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* 系统名称 - 在移动端隐藏 */}
          <div className="hidden md:block mr-8">
            <Link href="/" className="text-xl font-bold">
              RBAC系统
            </Link>
          </div>

          {/* 导航链接 - 在移动端隐藏 */}
          <div className="hidden md:flex gap-6 mr-auto">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              仪表盘
            </Link>
            <Link
              href="/users"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              用户管理
            </Link>
            <Link
              href="/roles"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              角色管理
            </Link>
            <Link
              href="/permissions"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              权限管理
            </Link>
            <Link
              href="/links"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              链接管理
            </Link>
            <Link
              href="/tags"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              标签管理
            </Link>
          </div>

          <div className="flex-1 md:flex-none"></div>

          {/* 主题切换和用户头像/登录按钮 */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <UserAvatar />
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">登录</Link>
              </Button>
            )}
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container px-4 py-3 mx-auto">
              <nav className="flex flex-col space-y-3">
                <Link
                  href="/dashboard"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  仪表盘
                </Link>
                <Link
                  href="/users"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  用户管理
                </Link>
                <Link
                  href="/roles"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  角色管理
                </Link>
                <Link
                  href="/permissions"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  权限管理
                </Link>
                <Link
                  href="/links"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  链接管理
                </Link>
                <Link
                  href="/tags"
                  className="py-2 text-sm font-medium transition-colors hover:text-primary"
                  onClick={toggleMenu}
                >
                  标签管理
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="container mx-auto py-6 px-4">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}

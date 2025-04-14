import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { logout, getCurrentUser } from "@/lib/auth";
import { useEffect, useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center px-4 mx-auto">
        <div className="mr-8">
          <Link href="/" className="text-xl font-bold">
            RBAC系统
          </Link>
        </div>
        <div className="flex gap-6 mr-auto">
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
        </div>
        <div className="flex items-center gap-4">
          {username ? (
            <>
              <span className="text-sm">欢迎, {username}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                退出登录
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

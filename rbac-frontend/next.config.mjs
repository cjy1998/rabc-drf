/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8088/api/v1/:path*", // 使用IPv4地址代理到后端Django服务
      },
    ];
  },
};

export default nextConfig;

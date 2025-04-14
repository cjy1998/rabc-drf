# RBAC 权限管理系统前端

基于 Next.js 和 shadcn/ui 开发的 RBAC 权限管理系统前端，配合 Django REST Framework 后端使用。

## 功能特性

- 用户认证与授权
- 用户管理
- 角色管理
- 权限管理
- 角色权限分配
- 用户角色分配

## 技术栈

- Next.js 14
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios
- React Hook Form
- Zod
- JWT 认证

## 使用方法

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行生产版本

```bash
npm start
```

## 配置说明

前端应用默认代理后端 API 请求到`http://localhost:8000`，如需修改后端 API 地址，请编辑`next.config.mjs`文件中的代理配置。

## 目录结构

- `/app` - 应用路由和页面
- `/components` - React 组件
- `/components/ui` - UI 组件（shadcn/ui）
- `/lib` - 工具函数和 API 服务
- `/types` - TypeScript 类型定义

## 与后端集成

本前端项目设计用于与 Django REST Framework 构建的 RBAC 后端集成，完美适配后端提供的 API：

- 用户认证（JWT）
- 用户 CRUD 操作
- 角色 CRUD 操作
- 权限 CRUD 操作
- 角色权限关联管理
- 用户角色关联管理

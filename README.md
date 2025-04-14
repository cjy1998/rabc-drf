# DRF RBAC 项目

这是一个使用 Django REST Framework 实现的 RBAC (基于角色的访问控制) 权限系统。

## 特点

- 自定义用户模型，不使用 Django 自带的用户表
- JWT 认证 (使用 djangorestframework-simplejwt)
- 基于角色的权限控制
- RESTful API 设计

## 项目结构

- `core/`: 项目核心配置
- `rbac/`: RBAC 应用，包含用户、角色和权限相关的功能

## 安装

1. 克隆项目
2. 创建虚拟环境
   ```
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```
3. 安装依赖
   ```
   pip install -r requirements.txt
   ```
4. 迁移数据库
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```
5. 初始化 RBAC 数据
   ```
   python manage.py init_rbac_data
   ```
6. 启动服务
   ```
   python manage.py runserver
   ```

## API 端点

### 认证

- `POST /api/v1/users/login/`: 用户登录，获取 JWT 令牌
- `POST /api/v1/token/refresh/`: 刷新 JWT 令牌

### 用户管理

- `GET /api/v1/users/`: 获取用户列表
- `POST /api/v1/users/`: 创建用户
- `GET /api/v1/users/{id}/`: 获取特定用户
- `PUT/PATCH /api/v1/users/{id}/`: 更新用户
- `DELETE /api/v1/users/{id}/`: 删除用户
- `POST /api/v1/users/{id}/change_password/`: 修改密码

### 角色管理

- `GET/POST /api/v1/roles/`: 获取/创建角色
- `GET/PUT/PATCH/DELETE /api/v1/roles/{id}/`: 操作特定角色

### 权限管理

- `GET/POST /api/v1/permissions/`: 获取/创建权限
- `GET/PUT/PATCH/DELETE /api/v1/permissions/{id}/`: 操作特定权限

### 角色权限关联

- `GET/POST /api/v1/role-permissions/`: 获取/创建角色权限关联
- `GET/PUT/PATCH/DELETE /api/v1/role-permissions/{id}/`: 操作特定角色权限关联

### 用户角色关联

- `GET/POST /api/v1/user-roles/`: 获取/创建用户角色关联
- `GET/PUT/PATCH/DELETE /api/v1/user-roles/{id}/`: 操作特定用户角色关联

## 默认账户

在运行 `init_rbac_data` 命令后，系统会创建以下账户：

1. 管理员账户

   - 用户名: admin
   - 密码: admin123
   - 角色: 管理员（拥有所有权限）

2. 普通用户账户
   - 用户名: user
   - 密码: user123
   - 角色: 普通用户（只有查看权限）

## API 文档

本项目提供了完整的 API 文档，可通过以下 URL 访问：

- Swagger UI: `/swagger/` - 提供交互式 API 文档，可以直接在浏览器中测试 API
- ReDoc: `/redoc/` - 提供更美观的 API 文档阅读体验

### 认证方式

API 使用 JWT（JSON Web Token）认证机制。要使用需要认证的 API 端点，请按照以下步骤操作：

1. 获取令牌：通过 `POST /api/v1/token/` 接口，提供用户名和密码获取访问令牌
2. 使用令牌：在后续请求的 Header 中添加 `Authorization: Bearer <您的访问令牌>`
3. 刷新令牌：通过 `POST /api/v1/token/refresh/` 接口，使用刷新令牌获取新的访问令牌

### API 分组

- 用户管理 (`/api/v1/users/`): 用户的 CRUD 操作
- 角色管理 (`/api/v1/roles/`): 角色的 CRUD 操作
- 权限管理 (`/api/v1/permissions/`): 权限的 CRUD 操作
- 角色权限管理 (`/api/v1/role-permissions/`): 角色和权限的关联管理
- 用户角色管理 (`/api/v1/user-roles/`): 用户和角色的关联管理

更详细的接口信息请查看 API 文档。

## 细粒度权限系统

本系统实现了细粒度的权限控制，允许为每个 API 操作分配不同的权限：

### 权限设计

权限按照以下格式命名：`<资源>_<操作>`，例如：

- `user_view`: 查看用户
- `role_create`: 创建角色
- `permission_delete`: 删除权限

### 权限列表

1. **用户管理权限**

   - `user_view`: 查看用户列表和详情
   - `user_create`: 创建新用户
   - `user_update`: 更新用户信息
   - `user_delete`: 删除用户
   - `user_change_password`: 修改用户密码

2. **角色管理权限**

   - `role_view`: 查看角色列表和详情
   - `role_create`: 创建新角色
   - `role_update`: 更新角色信息
   - `role_delete`: 删除角色

3. **权限管理权限**

   - `permission_view`: 查看权限列表和详情
   - `permission_create`: 创建新权限
   - `permission_update`: 更新权限信息
   - `permission_delete`: 删除权限

4. **角色权限关联管理权限**

   - `role_permission_view`: 查看角色权限关联
   - `role_permission_create`: 创建角色权限关联
   - `role_permission_update`: 更新角色权限关联
   - `role_permission_delete`: 删除角色权限关联

5. **用户角色关联管理权限**
   - `user_role_view`: 查看用户角色关联
   - `user_role_create`: 创建用户角色关联
   - `user_role_update`: 更新用户角色关联
   - `user_role_delete`: 删除用户角色关联

### 初始化权限数据

运行以下命令初始化所有权限数据：

```
python manage.py init_permissions
```

### 权限分配

1. 首先创建角色
2. 为角色分配适当的权限
3. 将用户分配到相应角色

通过这种方式，可以实现非常精细的权限控制，例如允许一个用户只查看角色但不能修改，或者只能修改用户但不能删除。

## API 文档装饰器

为了简化 API 文档的编写，本项目提供了一组自定义的文档装饰器：

### 基础装饰器

```python
from rbac.utils.swagger import api_docs

@api_docs(
    summary='操作名称',
    description='详细描述',
    security=True,  # 是否需要认证
    responses={200: '成功响应'}
)
def my_view(request):
    ...
```

### 预定义 CRUD 操作装饰器

```python
from rbac.utils.swagger import (
    list_api_docs, create_api_docs, retrieve_api_docs,
    update_api_docs, partial_update_api_docs, destroy_api_docs
)

# 列表API
@list_api_docs(description='获取用户列表')
def list(self, request, *args, **kwargs):
    ...

# 创建API
@create_api_docs(description='创建新用户')
def create(self, request, *args, **kwargs):
    ...

# 详情API
@retrieve_api_docs(description='获取用户详情')
def retrieve(self, request, *args, **kwargs):
    ...
```

这些装饰器封装了标准的 swagger_auto_schema 装饰器，提供了更简洁的语法和一致的文档风格。

## 权限装饰器

本项目使用装饰器实现了细粒度的权限控制，提供了两种主要的权限装饰器：

### 权限检查装饰器

`@has_permission` 装饰器用于检查用户是否拥有指定的权限：

```python
from rbac.decorators import has_permission

@has_permission('user_view')
def list(self, request, *args, **kwargs):
    # 只有拥有 user_view 权限的用户才能访问此方法
    return super().list(request, *args, **kwargs)
```

### 自己资源检查装饰器

`@self_or_admin` 装饰器确保用户只能操作属于自己的资源（或者是管理员）：

```python
from rbac.decorators import self_or_admin

@self_or_admin
def update(self, request, *args, **kwargs):
    # 用户只能更新自己的资源
    return super().update(request, *args, **kwargs)
```

### 组合使用装饰器

装饰器可以组合使用，从而实现更精细的权限控制：

```python
@self_or_admin
@has_permission('user_update')
def update(self, request, *args, **kwargs):
    # 用户必须同时 (1) 拥有user_update权限 且 (2) 是操作自己的资源
    return super().update(request, *args, **kwargs)
```

权限装饰器方式比传统的权限类更灵活，允许为每个 API 方法单独定义权限要求。

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.contrib.auth import authenticate
from drf_yasg import openapi

# 导入自定义文档装饰器
from utils.swagger import (
    api_docs, list_api_docs, create_api_docs, retrieve_api_docs,
    update_api_docs, partial_update_api_docs, destroy_api_docs
)

# 导入权限装饰器
from .decorators import has_permission, self_or_admin

from .models import User, Role, Permission, RolePermission, UserRole
from .serializers import (
    UserSerializer, RoleSerializer, PermissionSerializer,
    RolePermissionSerializer, UserRoleSerializer,
    UserLoginSerializer, ChangePasswordSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    用户管理API
    
    提供用户的CRUD操作、登录和修改密码功能
    """
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        只允许未登录用户访问创建和登录接口，其他接口都需要身份验证。
        权限检查会在各方法中通过装饰器进行。
        """
        if self.action in ['create', 'login']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @list_api_docs(description='获取所有用户列表，需要管理员权限')
    @has_permission('user_view')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @create_api_docs(
        description='注册新用户，不需要认证',
        security=False
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @retrieve_api_docs(description='获取单个用户的详细信息，普通用户只能查看自己的信息')
    @self_or_admin
    @has_permission('user_view')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @update_api_docs(description='更新用户的全部信息，普通用户只能修改自己的信息')
    @self_or_admin
    @has_permission('user_update')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @partial_update_api_docs(description='部分更新用户信息，普通用户只能修改自己的信息')
    @self_or_admin
    @has_permission('user_update')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @destroy_api_docs(description='删除用户，需要user_delete权限')
    @has_permission('user_delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @api_docs(
        summary='用户登录',
        description='通过用户名和密码登录，返回JWT令牌和用户信息',
        security=False,
        request_body=UserLoginSerializer,
        responses={
            200: openapi.Response(
                description='登录成功',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='刷新令牌'),
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='访问令牌'),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='用户ID'),
                                'username': openapi.Schema(type=openapi.TYPE_STRING, description='用户名'),
                                'email': openapi.Schema(type=openapi.TYPE_STRING, description='邮箱'),
                                'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='名'),
                                'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='姓'),
                                'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='是否激活'),
                                'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='是否管理员'),
                                'date_joined': openapi.Schema(type=openapi.TYPE_STRING, description='注册时间')
                            }
                        )
                    }
                )
            ),
            401: '无效的凭据'
        }
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                user_serializer = UserSerializer(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': user_serializer.data
                })
            
            return Response(
                {'detail': '无效的凭据'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @api_docs(
        summary='修改密码',
        description='修改当前用户的密码，需要提供旧密码和新密码',
        request_body=ChangePasswordSerializer,
        responses={
            200: '密码已成功修改',
            400: '旧密码不正确或新密码不符合要求',
            403: '没有权限修改其他用户的密码'
        }
    )
    @action(detail=True, methods=['post'])
    @self_or_admin
    @has_permission('user_change_password')
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"detail": "旧密码不正确"}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "密码已成功修改"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleViewSet(viewsets.ModelViewSet):
    """
    角色管理API
    
    提供角色的CRUD操作，需要具有相应权限
    """
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    @list_api_docs(description='列出系统中所有角色')
    @has_permission('role_view')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @create_api_docs(description='创建一个新角色')
    @has_permission('role_create')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @retrieve_api_docs(description='获取指定角色的详细信息')
    @has_permission('role_view')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @update_api_docs(description='更新指定角色的信息')
    @has_permission('role_update')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @partial_update_api_docs(description='部分更新指定角色的信息')
    @has_permission('role_update')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @destroy_api_docs(description='删除指定的角色')
    @has_permission('role_delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class PermissionViewSet(viewsets.ModelViewSet):
    """
    权限管理API
    
    提供权限的CRUD操作，需要具有相应权限
    """
    queryset = Permission.objects.all().order_by('id')
    serializer_class = PermissionSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    @list_api_docs(description='列出系统中所有权限')
    @has_permission('permission_view')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @create_api_docs(description='创建一个新权限')
    @has_permission('permission_create')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @retrieve_api_docs(description='获取指定权限的详细信息')
    @has_permission('permission_view')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @update_api_docs(description='更新指定权限的信息')
    @has_permission('permission_update')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @partial_update_api_docs(description='部分更新指定权限的信息')
    @has_permission('permission_update')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @destroy_api_docs(description='删除指定的权限')
    @has_permission('permission_delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class RolePermissionViewSet(viewsets.ModelViewSet):
    """
    角色权限管理API
    
    提供角色权限关联的CRUD操作，需要具有相应权限
    """
    queryset = RolePermission.objects.all().order_by('id')
    serializer_class = RolePermissionSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    @list_api_docs(description='列出系统中所有角色权限关联')
    @has_permission('role_permission_view')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @create_api_docs(description='为角色分配权限')
    @has_permission('role_permission_create')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @retrieve_api_docs(description='获取指定角色权限关联的详细信息')
    @has_permission('role_permission_view')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @update_api_docs(description='更新指定的角色权限关联')
    @has_permission('role_permission_update')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @partial_update_api_docs(description='部分更新指定的角色权限关联')
    @has_permission('role_permission_update')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @destroy_api_docs(description='删除指定的角色权限关联')
    @has_permission('role_permission_delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class UserRoleViewSet(viewsets.ModelViewSet):
    """
    用户角色管理API
    
    提供用户角色关联的CRUD操作，需要具有相应权限
    """
    queryset = UserRole.objects.all().order_by('id')
    serializer_class = UserRoleSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    @list_api_docs(description='列出系统中所有用户角色关联')
    @has_permission('user_role_view')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @create_api_docs(description='为用户分配角色')
    @has_permission('user_role_create')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @retrieve_api_docs(description='获取指定用户角色关联的详细信息')
    @has_permission('user_role_view')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @update_api_docs(description='更新指定的用户角色关联')
    @has_permission('user_role_update')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @partial_update_api_docs(description='部分更新指定的用户角色关联')
    @has_permission('user_role_update')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @destroy_api_docs(description='删除指定的用户角色关联')
    @has_permission('user_role_delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT令牌获取API
    
    通过用户名和密码获取JWT令牌
    """
    @api_docs(
        summary='获取JWT令牌',
        description='使用用户名和密码获取JWT访问和刷新令牌',
        security=False,
        request_body=TokenObtainPairSerializer,
        responses={
            200: openapi.Response(
                description='认证成功',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='刷新令牌'),
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='访问令牌'),
                    }
                )
            ),
            401: '无效的凭据'
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class CustomTokenRefreshView(TokenRefreshView):
    """
    刷新JWT令牌API
    
    通过刷新令牌获取新的访问令牌
    """
    @api_docs(
        summary='刷新JWT令牌',
        description='使用刷新令牌获取新的访问令牌',
        security=False,
        request_body=TokenRefreshSerializer,
        responses={
            200: openapi.Response(
                description='刷新成功',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='新的访问令牌'),
                    }
                )
            ),
            401: '无效的刷新令牌'
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

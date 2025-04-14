from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def has_permission(permission_code):
    """
    检查用户是否拥有指定权限的装饰器
    
    使用方式：
    @has_permission('user_view')
    def my_view_method(self, request, *args, **kwargs):
        # 方法实现...
    
    参数:
        permission_code (str): 要检查的权限代码
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            # 未认证用户直接拒绝
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {"detail": "认证凭据无效或未提供"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # 超级用户拥有所有权限
            if request.user.is_superuser:
                return view_func(self, request, *args, **kwargs)
                
            # 使用模型导入到函数内部，避免循环引用
            from .models import UserRole, RolePermission
            
            # 获取用户的所有角色
            user_roles = UserRole.objects.filter(user=request.user)
            role_ids = [user_role.role_id for user_role in user_roles]
            
            # 检查用户角色是否具有所需权限
            has_perm = RolePermission.objects.filter(
                role_id__in=role_ids,
                permission__codename=permission_code
            ).exists()
            
            if has_perm:
                return view_func(self, request, *args, **kwargs)
            else:
                return Response(
                    {"detail": f"您没有 '{permission_code}' 权限执行此操作"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        return _wrapped_view
    return decorator


def self_or_admin(view_func):
    """
    确保用户只能操作自己的资源，或者是管理员
    
    使用方式：
    @self_or_admin
    def update(self, request, *args, **kwargs):
        # 方法实现...
    
    注意：被装饰的方法必须有一个self.get_object()方法来获取当前操作的对象
    """
    @wraps(view_func)
    def _wrapped_view(self, request, *args, **kwargs):
        # 超级用户可以操作所有资源
        if request.user.is_superuser:
            return view_func(self, request, *args, **kwargs)
        
        # 获取当前操作的对象
        instance = self.get_object()
        
        # 检查对象是否属于当前用户
        if hasattr(instance, 'user_id') and instance.user_id == request.user.id:
            return view_func(self, request, *args, **kwargs)
        elif instance.id == request.user.id:  # 当操作的是User对象自身时
            return view_func(self, request, *args, **kwargs)
        else:
            return Response(
                {"detail": "您只能操作自己的资源"}, 
                status=status.HTTP_403_FORBIDDEN
            )
    return _wrapped_view 
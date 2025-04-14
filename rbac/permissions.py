from rest_framework import permissions
from .models import UserRole, RolePermission

class HasRolePermission(permissions.BasePermission):
    """
    检查用户是否拥有特定权限的自定义权限类
    
    使用方式：在视图类中设置 required_permission 属性
    """
    
    def has_permission(self, request, view):
        # 未认证用户没有权限
        if not request.user or not request.user.is_authenticated:
            return False
            
        # 超级用户拥有所有权限
        if request.user.is_superuser:
            return True
        
        # 确定所需的权限
        required_permission = self._get_required_permission(request, view)
        
        # 如果没有指定所需权限，默认拒绝访问
        if not required_permission:
            return False
            
        # 获取用户的所有角色
        user_roles = UserRole.objects.filter(user=request.user)
        role_ids = [user_role.role_id for user_role in user_roles]
        
        # 查询这些角色是否拥有所需权限
        has_perm = RolePermission.objects.filter(
            role_id__in=role_ids,
            permission__codename=required_permission
        ).exists()
        
        return has_perm
        
    def _get_required_permission(self, request, view):
        """
        获取当前操作所需的权限
        
        使用视图类的 required_permission 属性
        """
        # 回退到视图类的 required_permission 属性
        if hasattr(view, 'required_permission'):
            return view.required_permission
            
        # 没有指定任何权限，返回 None
        return None 
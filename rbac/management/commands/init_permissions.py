from django.core.management.base import BaseCommand
from rbac.models import Permission
import time
from django.db.utils import IntegrityError

class Command(BaseCommand):
    help = '初始化RBAC系统的细粒度权限'

    def handle(self, *args, **options):
        # 用户管理权限
        user_permissions = [
            ('user_view', '查看用户', '查看用户列表和详情'),
            ('user_create', '创建用户', '创建新用户'),
            ('user_update', '更新用户', '更新用户信息'),
            ('user_delete', '删除用户', '删除用户'),
            ('user_change_password', '修改用户密码', '修改用户密码'),
        ]
        
        # 角色管理权限
        role_permissions = [
            ('role_view', '查看角色', '查看角色列表和详情'),
            ('role_create', '创建角色', '创建新角色'),
            ('role_update', '更新角色', '更新角色信息'),
            ('role_delete', '删除角色', '删除角色'),
        ]
        
        # 权限管理权限
        permission_permissions = [
            ('permission_view', '查看权限', '查看权限列表和详情'),
            ('permission_create', '创建权限', '创建新权限'),
            ('permission_update', '更新权限', '更新权限信息'),
            ('permission_delete', '删除权限', '删除权限'),
        ]
        
        # 角色权限关联管理权限
        role_permission_permissions = [
            ('role_permission_view', '查看角色权限', '查看角色权限关联'),
            ('role_permission_create', '创建角色权限', '创建角色权限关联'),
            ('role_permission_update', '更新角色权限', '更新角色权限关联'),
            ('role_permission_delete', '删除角色权限', '删除角色权限关联'),
        ]
        
        # 用户角色关联管理权限
        user_role_permissions = [
            ('user_role_view', '查看用户角色', '查看用户角色关联'),
            ('user_role_create', '创建用户角色', '创建用户角色关联'),
            ('user_role_update', '更新用户角色', '更新用户角色关联'),
            ('user_role_delete', '删除用户角色', '删除用户角色关联'),
        ]
        
        # 合并所有权限
        all_permissions = (
            user_permissions + 
            role_permissions + 
            permission_permissions + 
            role_permission_permissions + 
            user_role_permissions
        )
        
        # 原有权限映射（保持兼容性）
        legacy_permissions = [
            ('user_management', '用户管理', '管理用户'),
            ('role_management', '角色管理', '管理角色'),
            ('permission_management', '权限管理', '管理权限'),
            ('role_permission_management', '角色权限管理', '管理角色权限关联'),
            ('user_role_management', '用户角色管理', '管理用户角色关联'),
        ]
        
        all_permissions.extend(legacy_permissions)
        
        # 使用时间戳确保临时名称不会冲突
        timestamp = int(time.time())
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        # 首先获取所有已存在的权限
        existing_names = {perm.name: perm for perm in Permission.objects.all()}
        existing_codes = {perm.codename: perm for perm in Permission.objects.all()}
        
        # 创建或更新权限
        for codename, name, description in all_permissions:
            try:
                # 检查codename是否已存在
                if codename in existing_codes:
                    # 更新现有权限
                    perm = existing_codes[codename]
                    perm.description = description
                    # 如果名称不同，且新名称不与其他权限冲突，则更新名称
                    if perm.name != name and name not in existing_names:
                        perm.name = name
                    perm.save()
                    self.stdout.write(f'✅ 更新权限: {codename}')
                    updated_count += 1
                else:
                    # 检查名称是否已被使用
                    if name in existing_names:
                        # 为名称添加时间戳，使其唯一
                        unique_name = f"{name}_{timestamp}"
                        self.stdout.write(
                            self.style.WARNING(f'⚠️ 权限名称冲突，使用唯一名称: {unique_name}')
                        )
                        # 创建新权限
                        Permission.objects.create(
                            codename=codename,
                            name=unique_name,
                            description=description
                        )
                    else:
                        # 创建新权限
                        Permission.objects.create(
                            codename=codename,
                            name=name,
                            description=description
                        )
                    self.stdout.write(f'✅ 创建权限: {codename}')
                    created_count += 1
                    # 更新现有权限映射
                    existing_names[name] = None
                    existing_codes[codename] = None
                
            except IntegrityError as e:
                # 处理唯一性约束错误
                self.stdout.write(
                    self.style.WARNING(f'⚠️ 权限 {codename} 创建失败(可能已存在): {str(e)}')
                )
                skipped_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ 处理权限 {codename} 失败: {str(e)}')
                )
                skipped_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✨ 初始化完成! 新建: {created_count} 个, 更新: {updated_count} 个, 跳过: {skipped_count} 个')
        ) 
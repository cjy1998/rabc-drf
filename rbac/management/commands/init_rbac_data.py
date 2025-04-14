from django.core.management.base import BaseCommand
from rbac.models import User, Role, Permission, RolePermission, UserRole

class Command(BaseCommand):
    help = '初始化RBAC系统的基础数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化RBAC数据...')
        
        # 创建超级管理员
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
            self.stdout.write(self.style.SUCCESS(f'创建超级管理员: {admin.username}'))
        
        # 创建普通用户
        if not User.objects.filter(username='user').exists():
            user = User.objects.create_user(
                username='user',
                email='user@example.com',
                password='user123'
            )
            self.stdout.write(self.style.SUCCESS(f'创建普通用户: {user.username}'))
        
        # 创建角色
        admin_role, _ = Role.objects.get_or_create(
            name='管理员',
            defaults={'description': '系统管理员，拥有所有权限'}
        )
        
        user_role, _ = Role.objects.get_or_create(
            name='普通用户',
            defaults={'description': '普通用户，拥有基本权限'}
        )
        
        self.stdout.write(self.style.SUCCESS('创建角色成功'))
        
        # 创建权限
        permissions_data = [
            {'name': '用户管理', 'codename': 'user_management', 'description': '管理系统用户'},
            {'name': '角色管理', 'codename': 'role_management', 'description': '管理系统角色'},
            {'name': '权限管理', 'codename': 'permission_management', 'description': '管理系统权限'},
            {'name': '角色权限管理', 'codename': 'role_permission_management', 'description': '管理角色权限关系'},
            {'name': '用户角色管理', 'codename': 'user_role_management', 'description': '管理用户角色关系'},
            {'name': '查看用户', 'codename': 'view_user', 'description': '查看用户信息'},
            {'name': '查看角色', 'codename': 'view_role', 'description': '查看角色信息'},
        ]
        
        created_permissions = []
        
        for perm_data in permissions_data:
            perm, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                defaults={
                    'name': perm_data['name'],
                    'description': perm_data['description']
                }
            )
            created_permissions.append(perm)
            if created:
                self.stdout.write(f'创建权限: {perm.name}')
        
        # 为角色分配权限
        # 管理员角色拥有所有权限
        for perm in created_permissions:
            RolePermission.objects.get_or_create(role=admin_role, permission=perm)
        
        # 普通用户角色只有查看权限
        view_permissions = [p for p in created_permissions if p.codename.startswith('view_')]
        for perm in view_permissions:
            RolePermission.objects.get_or_create(role=user_role, permission=perm)
        
        self.stdout.write(self.style.SUCCESS('角色权限分配成功'))
        
        # 为用户分配角色
        admin_user = User.objects.get(username='admin')
        UserRole.objects.get_or_create(user=admin_user, role=admin_role)
        
        regular_user = User.objects.get(username='user')
        UserRole.objects.get_or_create(user=regular_user, role=user_role)
        
        self.stdout.write(self.style.SUCCESS('用户角色分配成功'))
        
        self.stdout.write(self.style.SUCCESS('RBAC数据初始化完成!')) 
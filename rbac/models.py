from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('用户必须有邮箱地址')
        if not username:
            raise ValueError('用户必须有用户名')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('超级用户必须有is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('超级用户必须有is_superuser=True')
        
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = '角色'
        verbose_name_plural = '角色'

class Permission(models.Model):
    name = models.CharField(max_length=50, unique=True)
    codename = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = '权限'
        verbose_name_plural = '权限'

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['role', 'permission']
        verbose_name = '角色权限'
        verbose_name_plural = '角色权限'

class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['user', 'role']
        verbose_name = '用户角色'
        verbose_name_plural = '用户角色'

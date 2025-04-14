from rest_framework import serializers
from .models import User, Role, Permission, RolePermission, UserRole

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined']
        read_only_fields = ['is_staff', 'date_joined']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'description']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class RolePermissionSerializer(serializers.ModelSerializer):
    role_name = serializers.ReadOnlyField(source='role.name')
    permission_name = serializers.ReadOnlyField(source='permission.name')
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'role_name', 'permission', 'permission_name']

class UserRoleSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    role_name = serializers.ReadOnlyField(source='role.name')
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'username', 'role', 'role_name']

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, required=True)
    password = serializers.CharField(max_length=128, required=True, write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=128, required=True, write_only=True)
    new_password = serializers.CharField(max_length=128, required=True, write_only=True)
    
    def validate_new_password(self, value):
        # 这里可以添加密码强度验证
        if len(value) < 8:
            raise serializers.ValidationError("密码必须至少8个字符")
        return value 
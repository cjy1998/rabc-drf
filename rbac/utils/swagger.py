from functools import wraps
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status

# 预定义常用的响应模式
COMMON_RESPONSES = {
    status.HTTP_400_BAD_REQUEST: '输入数据验证失败',
    status.HTTP_401_UNAUTHORIZED: '用户未登录或登录已过期',
    status.HTTP_403_FORBIDDEN: '当前用户无权限执行此操作',
    status.HTTP_404_NOT_FOUND: '请求的资源不存在',
    status.HTTP_500_INTERNAL_SERVER_ERROR: '服务器内部错误'
}

# 预定义的响应模式
SUCCESS_RESPONSE = openapi.Response(
    description='操作成功',
    schema=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'success': openapi.Schema(type=openapi.TYPE_BOOLEAN, default=True),
            'message': openapi.Schema(type=openapi.TYPE_STRING),
            'data': openapi.Schema(type=openapi.TYPE_OBJECT)
        }
    )
)

# 自定义操作描述装饰器
def api_docs(summary='', description='', security=True, responses=None, **kwargs):
    """
    简化的Swagger文档装饰器，用于为API添加标准化的文档信息
    
    Args:
        summary: API操作的概要说明
        description: API操作的详细描述
        security: 是否需要认证，默认为True
        responses: 自定义响应信息，会与通用响应合并
        **kwargs: 传递给swagger_auto_schema的其他参数
    
    Returns:
        装饰器函数
    """
    def decorator(func):
        # 构建响应信息
        api_responses = COMMON_RESPONSES.copy()
        if responses:
            api_responses.update(responses)
        
        # 添加安全要求
        if security:
            kwargs['security'] = [{'Bearer': []}]
        
        # 设置摘要和描述
        kwargs['operation_summary'] = summary
        kwargs['operation_description'] = description
        kwargs['responses'] = api_responses
        
        # 应用swagger_auto_schema装饰器
        return swagger_auto_schema(**kwargs)(func)
    
    return decorator


# 针对标准ViewSet方法的预定义装饰器
def list_api_docs(description=None, **kwargs):
    """获取列表数据的API文档装饰器"""
    return api_docs(
        summary='获取列表数据',
        description=description or '获取资源的列表数据',
        **kwargs
    )

def create_api_docs(description=None, **kwargs):
    """创建资源的API文档装饰器"""
    return api_docs(
        summary='创建资源',
        description=description or '创建新的资源',
        **kwargs
    )

def retrieve_api_docs(description=None, **kwargs):
    """获取详情的API文档装饰器"""
    return api_docs(
        summary='获取详情',
        description=description or '获取资源的详细信息',
        **kwargs
    )

def update_api_docs(description=None, **kwargs):
    """更新资源的API文档装饰器"""
    return api_docs(
        summary='更新资源',
        description=description or '更新资源的全部信息',
        **kwargs
    )

def partial_update_api_docs(description=None, **kwargs):
    """部分更新资源的API文档装饰器"""
    return api_docs(
        summary='部分更新资源',
        description=description or '部分更新资源信息',
        **kwargs
    )

def destroy_api_docs(description=None, **kwargs):
    """删除资源的API文档装饰器"""
    return api_docs(
        summary='删除资源',
        description=description or '删除指定的资源',
        **kwargs
    ) 
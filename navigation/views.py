from django.shortcuts import render
from rest_framework import permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.viewsets import ModelViewSet

from navigation.models import Links, Tags
from navigation.serializers import LinksSerializer, TagsSerializer
from utils.swagger import api_docs


# Create your views here.
@api_docs(summary="链接相关操作")
class LinksView(ModelViewSet):
    queryset = Links.objects.all().prefetch_related('tags')  # 预取tags
    serializer_class = LinksSerializer
    permission_classes = [permissions.AllowAny]
    # filterset_fields = ["is_show", "is_recommend", "tags"]
    # search_fields = ["title", "url", "description"]
    # ordering_fields = ["sort_order", "click_count", "created_at", "updated_at"]
    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     is_show = self.request.query_params.get('is_show')
    #     is_recommend = self.request.query_params.get('is_recommend')
    #     if is_show is not None:
    #         queryset = queryset.filter(is_show=is_show)
    #
    #     if is_recommend is not None:
    #         queryset = queryset.filter(is_recommend=is_recommend)
    #     return queryset

@api_docs(summary="标签相关操作")
class TagsView(ModelViewSet):
    queryset = Tags.objects.all()
    serializer_class = TagsSerializer
    permission_classes = [permissions.AllowAny]
    # filterset_fields = ["is_show"]
    # search_fields = ["name", "slug", "description"]
    # ordering_fields = ["sort_order", "created_at", "updated_at"]
    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     is_show = self.request.query_params.get('is_show')
    #     if is_show is not None:
    #         queryset = queryset.filter(is_show=is_show)
    #     return queryset

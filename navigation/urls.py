from django.urls import path, include
from rest_framework.routers import DefaultRouter

from navigation.views import TagsView, LinksView

router = DefaultRouter(trailing_slash=False)
router.register(r'tags', TagsView, basename='tags')
router.register(r'links', LinksView, basename='links')

urlpatterns = [
    path('', include(router.urls)),
]
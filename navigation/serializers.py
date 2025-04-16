from rest_framework.serializers import ModelSerializer

from navigation.models import Tags, Links


class TagsSerializer(ModelSerializer):
    class Meta:
        model = Tags
        fields = "__all__"
        read_only_fields = ("id",)
class LinksSerializer(ModelSerializer):
    class Meta:
        model = Links
        fields = "__all__"
        read_only_fields = ("id",)
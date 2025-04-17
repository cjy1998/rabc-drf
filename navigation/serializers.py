from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from navigation.models import Tags, Links


class TagsSerializer(ModelSerializer):
    class Meta:
        model = Tags
        fields = "__all__"
        read_only_fields = ("id",)
class LinksSerializer(ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tags.objects.all(),
        # 允许通过ID列表进行写入
    )
    class Meta:
        model = Links
        fields = "__all__"
        read_only_fields = ("id",)

    def to_representation(self, instance):
        # 调用父类方法获取原始序列化数据
        representation = super().to_representation(instance)
        # 将tags字段替换为包含id和name的字典
        representation['tags'] = [
            {'id': tag.id, 'name': tag.name}
            for tag in instance.tags.all()
        ]
        return representation

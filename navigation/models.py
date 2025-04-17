from django.db import models

# Create your models here.
class Tags(models.Model):
    name = models.CharField(max_length=50, unique=True,verbose_name='标签名称')
    slug = models.SlugField(max_length=50, unique=True, db_index=True ,verbose_name='标签标识')
    description = models.TextField(blank=True, null=True ,verbose_name='标签描述')
    icon = models.CharField(max_length=50, blank=True, null=True ,verbose_name='标签图标')
    color = models.CharField(max_length=7, blank=True, null=True ,verbose_name='标签颜色')
    sort_order = models.IntegerField(blank=True, null=True ,verbose_name='标签排序')
    is_show = models.BooleanField(default=True ,verbose_name='是否显示')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, related_name="children", blank=True, null=True,
                               verbose_name='父级标签')
    created_at = models.DateTimeField(auto_now_add=True ,verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True ,verbose_name='更新时间')
    class Meta:
        db_table = 'tags'
        verbose_name = '标签'
        verbose_name_plural = '标签'
    def __str__(self):
        return self.name
class Links(models.Model):
    title = models.CharField(max_length=50,unique=True,verbose_name='链接标题')
    url = models.URLField(unique=True,verbose_name='链接地址')
    description = models.TextField(blank=True, null=True,verbose_name='链接描述')
    icon = models.CharField(max_length=50, blank=True, null=True,verbose_name='链接图标')
    click_count = models.IntegerField(default=0,verbose_name='点击次数')
    is_recommend = models.BooleanField(default=False,verbose_name='是否推荐')
    is_show = models.BooleanField(default=True,verbose_name='是否显示')
    sort_order = models.IntegerField(blank=True, null=True,verbose_name='链接排序')
    tags = models.ManyToManyField(Tags, blank=True,related_name="links" ,verbose_name='标签')
    created_at = models.DateTimeField(auto_now_add=True,verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True,verbose_name='更新时间')
    class Meta:
        db_table = 'links'
        verbose_name = '链接'
        verbose_name_plural = '链接'
    def __str__(self):
        return self.title
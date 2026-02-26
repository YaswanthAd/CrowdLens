from django.contrib import admin
from .models import Title, Genre, Person, TitleCast

class CastInline(admin.TabularInline):
    model = TitleCast
    extra = 0

@admin.register(Title)
class TitleAdmin(admin.ModelAdmin):
    list_display = ["title", "title_type", "release_date", "senti_score", "avg_user_rating"]
    list_filter = ["title_type", "status", "genres"]
    search_fields = ["title", "original_title"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [CastInline]

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "tmdb_id"]
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["name", "tmdb_id"]
    search_fields = ["name"]

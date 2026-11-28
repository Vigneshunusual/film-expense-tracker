from django.contrib import admin

from .models import Production


@admin.register(Production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "organization",
        "status",
        "start_date",
        "end_date",
    )

    list_filter = (
        "status",
        "organization",
    )

    search_fields = (
        "name",
        "code",
        "organization__name",
    )

    readonly_fields = ("created_at", "updated_at")



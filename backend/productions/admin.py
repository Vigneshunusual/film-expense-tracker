from django.contrib import admin

from .models import Production, ProductionMembership


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
    )


@admin.register(ProductionMembership)
class ProductionMembershipAdmin(admin.ModelAdmin):
    list_display = (
        "production",
        "user",
        "role",
        "created_at",
    )

    list_filter = (
        "role",
        "production",
    )

    search_fields = (
        "production__name",
        "user__email",
    )
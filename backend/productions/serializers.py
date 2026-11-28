from rest_framework import serializers

from .models import Production


class ProductionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Production
        fields = [
            "id",
            "name",
            "code",
            "status",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Production name cannot be empty."
            )

        return value

    def validate_code(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Production code cannot be empty."
            )

        if self.instance:
            organization = self.instance.organization
        else:
            request = self.context.get("request")

            if not request:
                return value

            organization = (
                request.user.organization_memberships.organization
            )

        existing_production = Production.objects.filter(
            organization=organization,
            code=value,
        )

        if self.instance:
            existing_production = existing_production.exclude(
                pk=self.instance.pk
            )

        if existing_production.exists():
            raise serializers.ValidationError(
                "A production with this code already exists "
                "in this organization's productions."
            )

        return value

    def validate(self, attrs):

        if self.instance:

            if self.instance.status == Production.Status.ARCHIVED:
                raise serializers.ValidationError(
                    "Archived productions cannot be modified."
                )

            if "status" in self.initial_data:
                raise serializers.ValidationError({
                    "status": (
                        "Production status must be changed "
                        "using the lifecycle actions."
                    )
                })

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if end_date and start_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        return attrs
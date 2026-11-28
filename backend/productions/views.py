from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Production
from .serializers import ProductionSerializer

from .permissions import (
    CanAccessProduction,
    IsProductionOwner,
    CanArchiveProduction,
    CanEditProduction,
    CanRestoreProduction,
)


class ProductionListCreateView(generics.ListCreateAPIView):

    serializer_class = ProductionSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [
                IsAuthenticated(),
                IsProductionOwner(),
            ]

        return [IsAuthenticated()]

    def get_queryset(self):
        membership = self.request.user.organization_memberships

        return Production.objects.filter(
            organization=membership.organization
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user
            .organization_memberships.organization
        )


class ProductionDetailView(generics.RetrieveUpdateAPIView):

    serializer_class = ProductionSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [
                IsAuthenticated(),
                CanAccessProduction(),
                CanEditProduction(),
            ]

        return [
            IsAuthenticated(),
            CanAccessProduction(),
        ]

    def get_queryset(self):
        membership = self.request.user.organization_memberships

        return Production.objects.filter(
            organization=membership.organization
        )


# --------------------------------------------------
# PRODUCTION LIFECYCLE
# --------------------------------------------------

class ProductionLifecycleView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsProductionOwner,
    ]

    expected_status = None
    new_status = None
    success_message = None

    def post(self, request, pk):

        membership = request.user.organization_memberships

        with transaction.atomic():

            production = get_object_or_404(
                Production.objects.select_for_update(),
                pk=pk,
                organization=membership.organization,
            )

            if production.status != self.expected_status:
                raise ValidationError({
                    "detail": (
                        f"This action is only allowed for "
                        f"{self.expected_status.lower()} productions."
                    )
                })

            production.status = self.new_status

            production.save(
                update_fields=["status", "updated_at"]
            )

        return Response(
            {
                "message": self.success_message,
                "production": ProductionSerializer(production).data,
            },
            status=status.HTTP_200_OK,
        )


class ProductionActivateView(ProductionLifecycleView):

    expected_status = Production.Status.PLANNED
    new_status = Production.Status.ACTIVE
    success_message = "Production activated successfully."


class ProductionCompleteView(ProductionLifecycleView):

    expected_status = Production.Status.ACTIVE
    new_status = Production.Status.COMPLETED
    success_message = "Production completed successfully."


# --------------------------------------------------
# ARCHIVE PRODUCTION
# --------------------------------------------------

class ProductionArchiveView(APIView):

    permission_classes = [
        IsAuthenticated,
        CanArchiveProduction,
    ]

    def post(self, request, pk):

        membership = request.user.organization_memberships

        with transaction.atomic():

            production = get_object_or_404(
                Production.objects.select_for_update(),
                pk=pk,
                organization=membership.organization,
            )

            if production.status == Production.Status.ARCHIVED:
                raise ValidationError(
                    "Production is already archived."
                )

            production.status = Production.Status.ARCHIVED

            production.save(
                update_fields=["status", "updated_at"]
            )

        return Response(
            {
                "message": "Production archived successfully.",
                "production": ProductionSerializer(production).data,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# RESTORE PRODUCTION
# --------------------------------------------------

class ProductionRestoreView(APIView):

    permission_classes = [
        IsAuthenticated,
        CanRestoreProduction,
    ]

    def post(self, request, pk):

        membership = request.user.organization_memberships

        with transaction.atomic():

            production = get_object_or_404(
                Production.objects.select_for_update(),
                pk=pk,
                organization=membership.organization,
                status=Production.Status.ARCHIVED,
            )

            production.status = Production.Status.PLANNED

            production.save(
                update_fields=["status", "updated_at"]
            )

        return Response(
            {
                "message": "Production restored successfully.",
                "production": ProductionSerializer(production).data,
            },
            status=status.HTTP_200_OK,
        )
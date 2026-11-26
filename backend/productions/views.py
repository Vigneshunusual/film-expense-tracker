from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Production
from .serializers import (
    ProductionSerializer,
    ProductionMembershipSerializer,
)

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

        user = self.request.user
        membership = user.organization_memberships

        if membership.role in [
            "OWNER",
            "ACCOUNTANT",
            "MANAGER",
        ]:

            return Production.objects.filter(
                organization=membership.organization
            )

        return Production.objects.filter(
            organization=membership.organization,
            memberships__user=user,
        ).distinct()

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

        user = self.request.user
        membership = user.organization_memberships

        if membership.role in [
            "OWNER",
            "ACCOUNTANT",
            "MANAGER",
        ]:

            return Production.objects.filter(
                organization=membership.organization
            )

        return Production.objects.filter(
            organization=membership.organization,
            memberships__user=user,
        ).distinct()


# --------------------------------------------------
# PRODUCTION LIFECYCLE
# --------------------------------------------------

class ProductionLifecycleView(APIView):

    permission_classes = [
        IsAuthenticated,
        CanEditProduction,
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


# --------------------------------------------------
# PRODUCTION MEMBERSHIP
# Deferred from V1 frontend, retained in backend.
# --------------------------------------------------

class ProductionMembershipCreateView(generics.CreateAPIView):

    serializer_class = ProductionMembershipSerializer

    permission_classes = [
        IsAuthenticated,
        IsProductionOwner,
    ]

    def get_serializer_context(self):

        context = super().get_serializer_context()

        production = get_object_or_404(
            Production,
            pk=self.kwargs["pk"],
            organization=self.request.user
            .organization_memberships.organization,
        )

        context["production"] = production

        return context

    def perform_create(self, serializer):

        production = serializer.context["production"]

        if production.status in [
            Production.Status.ARCHIVED,
            Production.Status.COMPLETED,
        ]:
            raise ValidationError(
                "Cannot assign members to a completed or archived production."
            )

        serializer.save(production=production)

# internall CreatAPIView   just for understand purpose:
# def create(self, request, *args, **kwargs):  #DRF's built-in method that manages the overall creation process.
#     serializer = self.get_serializer(data=request.data)     =>serializer = ProductionMembershipSerializer(data=request.data)
#     serializer.is_valid(raise_exception=True)
#     self.perform_create(serializer)
#     headers = self.get_success_headers(seriaizer.data)
#     return Response(
#         serializer.data,
#         status=201,
#         headers=headers
#     )
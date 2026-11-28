from rest_framework.permissions import BasePermission


def get_membership(user):
    if not user.is_authenticated:
        return None

    try:
        return user.organization_memberships
    except Exception:
        return None


class CanAccessProduction(BasePermission):
    """All organization roles can access their organization's productions."""

    def has_object_permission(self, request, view, obj):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.organization_id == obj.organization_id
            and membership.role in [
                "OWNER",
                "MANAGER",
                "ACCOUNTANT",
            ]
        )


class IsProductionOwner(BasePermission):
    """Only the organization Owner can create productions."""

    def has_permission(self, request, view):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.role == "OWNER"
        )


class CanEditProduction(BasePermission):
    """Owner and Manager can edit production details."""

    def has_object_permission(self, request, view, obj):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.organization_id == obj.organization_id
            and membership.role in ["OWNER", "MANAGER"]
        )


class CanArchiveProduction(BasePermission):
    """Only Owner can archive productions."""

    def has_permission(self, request, view):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.role == "OWNER"
        )

    def has_object_permission(self, request, view, obj):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.organization_id == obj.organization_id
            and membership.role == "OWNER"
        )


class CanRestoreProduction(BasePermission):
    """Only Owner can restore productions."""

    def has_permission(self, request, view):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.role == "OWNER"
        )

    def has_object_permission(self, request, view, obj):
        membership = get_membership(request.user)

        return (
            membership is not None
            and membership.organization_id == obj.organization_id
            and membership.role == "OWNER"
        )
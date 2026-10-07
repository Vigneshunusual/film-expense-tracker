from rest_framework.permissions import BasePermission

from accounts.models import OrganizationMembership
from .models import ProductionMembership


class CanAccessProduction(BasePermission):   #“Can this user access this Production?

    def has_object_permission(self, request, view, obj):
        membership = request.user.organization_memberships   # (membership.role = OWNER / MANAGER / ACCOUNTANT / MEMBER)

        # Organization-wide access
        if membership.role in [
            OrganizationMembership.Role.OWNER, 
            OrganizationMembership.Role.ACCOUNTANT,
        ]:   
            return True

        # Production-specific access
             #Is the currently logged-in user assigned to this production?
        return ProductionMembership.objects.filter(
            production=obj,    #Find a ProductionMembership for Film ABC.  (obj is the Production currently being accessed.)
            user=request.user,  #is the currently logged-in user.
        ).exists()


class IsProductionOwner(BasePermission):  #“Is the currently logged-in user the OWNER of the organization?”
   
    def has_permission(self, request, view):
        membership = request.user.organization_memberships

        return membership.role == "OWNER"


class CanArchiveProduction(BasePermission):  #“Is the currently logged-in user the OWNER?” IF YEs => Allow ARCHIVE

    def has_permission(self, request, view):
        membership = request.user.organization_memberships

        return membership.role == "OWNER"
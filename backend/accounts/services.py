from .models import OrganizationMembership


def get_user_organization(user):

    #"While getting the membership, also fetch the related Organization for the logged in  user."
    membership = OrganizationMembership.objects.select_related(
        'organization'
    ).get(user=user)

    return membership.organization
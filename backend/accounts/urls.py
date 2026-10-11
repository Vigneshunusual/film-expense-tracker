from django.urls import path

from .views import RegisterView, LoginView, RefreshTokenView, LogoutView, CurrentOrganizationView,CurrentUserView,CSRFTokenView,CreateOrganizationInvitationView, OrganizationInvitationDetailView,AcceptOrganizationInvitationView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    #jsut for tetsing
    # path('protected/', ProtectedTestView.as_view(), name='protected'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('organization/',CurrentOrganizationView.as_view(),name='current-organization'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf-token'),
    path('invitations/',CreateOrganizationInvitationView.as_view(),name='create-invitation',),  #Nishok creates an invitation.
    path('invitations/<uuid:token>/',OrganizationInvitationDetailView.as_view(),name='invitation-detail',),   #Arun views his invitation details.
    path('invitations/<uuid:token>/accept/',AcceptOrganizationInvitationView.as_view(),name='accept-invitation',),
    #fortetsing only
    # path('tenant-test/',TenantIsolationTestView.as_view(),name='tenant-test'),
]
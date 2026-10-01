from django.urls import path

from .views import RegisterView, LoginView, RefreshTokenView, LogoutView, CurrentOrganizationView, TenantIsolationTestView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    #jsut for tetsing
    # path('protected/', ProtectedTestView.as_view(), name='protected'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('organization/',CurrentOrganizationView.as_view(),name='current-organization'),

    #fortetsing only
    # path('tenant-test/',TenantIsolationTestView.as_view(),name='tenant-test'),
]
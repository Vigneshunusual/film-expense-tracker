from django.urls import path

from .views import (ProductionListCreateView,ProductionDetailView,ProductionArchiveView,ProductionMembershipCreateView,)

urlpatterns = [
    path("",ProductionListCreateView.as_view(),name="production-list-create",),
    path("<int:pk>/",ProductionDetailView.as_view(),name="production-detail",),
    path("<int:pk>/archive/",ProductionArchiveView.as_view(),name="production-archive",),
    path("<int:pk>/members/",ProductionMembershipCreateView.as_view(),name="production-membership-create",),
]



# This gives us:

# GET    /api/productions/
# POST   /api/productions/

# GET    /api/productions/1/
# PUT    /api/productions/1/
# PATCH  /api/productions/1/
# DELETE /api/productions/1/
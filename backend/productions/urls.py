from django.urls import path

from .views import (
    ProductionListCreateView,
    ProductionDetailView,
    ProductionArchiveView,
    ProductionRestoreView,
    ProductionActivateView,
    ProductionCompleteView,
)


urlpatterns = [

    # Production listing and creation
    path("",ProductionListCreateView.as_view(),name="production-list-create",),

    # Production details and editing
    path("<int:pk>/",ProductionDetailView.as_view(),name="production-detail",),

    # Lifecycle actions
    path("<int:pk>/activate/",ProductionActivateView.as_view(),name="production-activate",),

    path("<int:pk>/complete/",ProductionCompleteView.as_view(),name="production-complete",),

    path("<int:pk>/archive/",ProductionArchiveView.as_view(),name="production-archive",),

    path("<int:pk>/restore/",ProductionRestoreView.as_view(),name="production-restore",),

]


# This gives us:

# GET    /api/productions/
# POST   /api/productions/

# GET    /api/productions/1/
# PUT    /api/productions/1/
# PATCH  /api/productions/1/
# DELETE /api/productions/1/
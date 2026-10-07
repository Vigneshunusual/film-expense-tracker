from rest_framework import generics
from rest_framework.permissions import IsAuthenticated  #logged-in users can access these APIs.

from .models import Production
from .serializers import ProductionSerializer,ProductionMembershipSerializer
from .permissions import CanAccessProduction,IsProductionOwner,CanArchiveProduction

# for Production ARchieve:
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

#OrganizationMembership tells us which organization the user belongs to. 
#ProductionMembership tells us which productions that user is assigned to.



class ProductionListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionSerializer  #it tells DRF which serializer this view should use.
        #“For this view, use ProductionSerializer to convert Production model data into JSON and JSON data into Production data.”
        #Use ProductionSerializer ->  Convert/validate Production data

    permission_classes = [IsAuthenticated]   #Only authenticated users can use this view

    def get_queryset(self):  #it tells the DRF, Which Production objects is this user allowed to work with?
        user = self.request.user   #is the currently authenticated Django user.(vignesh)
        membership = user.organization_memberships    #(vignesh-> oGC -> OWNER)

        # OWNER and ACCOUNTANT can see all productions
        if membership.role in [ "OWNER", "ACCOUNTANT",]:
            return Production.objects.filter(    #if logged  user ia owner, he can see all productuons
                organization=membership.organization  # membership.organization = OGC Films (tehn django perform: FInd production  WHERE org=>OGC)
            )

        # Other users can see only productions what they are assigned to
        return Production.objects.filter(
            organization=membership.organization,   #OGC Films(So productions from another organization cannot appear.)

            #Find productions whose ProductionMembership contains this user.
            memberships__user=user,   #(which means Production=>ProductionMembership=> user ) and __ menans foloow the rel to another model
        ).distinct()

    def perform_create(self, serializer):  #runs when a new Production is created.
        serializer.save(organization=self.request.user.organization_memberships.organization)  #This automatically attaches the new Production to the logged-in user's organization.
                     #Logged-in user = Vignesh and Organization = OGC Films
                     #now the user(vignesh) sends {name:FILM1 , code =001, satrt-date=..}
                     #save() means "Use this validated data to create the Production object and save that object to the database."
                        # so serializer.save() means : Tell the serializer to create/update the model object using the validated data.

class ProductionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProductionSerializer
    permission_classes = [IsAuthenticated,CanAccessProduction]

    def get_queryset(self):   #retrive, update and delete
        user = self.request.user
        membership = user.organization_memberships

        # OWNER and ACCOUNTANT can access all productions
        if membership.role in ["OWNER","ACCOUNTANT",]:
            return Production.objects.filter(   # #if logged  user ia owner, he can see all productuons
                organization=membership.organization   # # membership.organization = OGC Films(tehn django perform: FInd production  WHERE org=>OGC)
            )

        # Other users can access only assigned productions
        return Production.objects.filter(   #So they can only retrieve/update/delete productions they are assigned to at the queryset level.
            organization=membership.organization,
            memberships__user=user,
        ).distinct()   #Return each Production only once.



#Archive is a custom operation:  Perform a special business action: archive this production.
#We are creating a custom API endpoint because archiving is not normal CRUD.
            # we dont want DELETE Productions
            # Instead, we want POST /api/productions/1/archive/ => change status to ARCHIVED
class ProductionArchiveView(APIView):
    permission_classes = [IsAuthenticated,CanArchiveProduction,]  #So only an authenticated Owner can archive.

    def post(self, request, pk):   # this handles :POST /api/productions/1/archive/
        production = Production.objects.get(    #Find production 1, but only if it belongs to the logged-in user's organization
            pk=pk,     #Vignesh=> oGC => Find Production ID 1 belonging to OGC Films 
            organization=request.user.organization_memberships.organization
        )

        production.status = "ARCHIVED"  #we're changing status from active to archeived. SO The database record remains
        production.save(update_fields=["status"])   #So instead of updating every field, Django only changes:status → ARCHIVED

        serializer = ProductionSerializer(production)  #Now we're giving the updated Production object to the serializer.So, it converts python obj to json

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    #So the key idea is: Archive does not remove the Production. It changes its status to ARCHIVED, preserving the financial history. 





#This view is for assigning a user to a specific production.
class ProductionMembershipCreateView(generics.CreateAPIView):  #Receive data → validate it → create a ProductionMembership record.
    serializer_class = ProductionMembershipSerializer  #Use ProductionMembershipSerializer to validate and create the membership.
    permission_classes = [IsAuthenticated,IsProductionOwner,]  #only an authenticated OWNER can assign users to productions.

    #CreateAPIView automatically does:req->serializer validation->perform_create(serializer)->save.So we customize perform_create() to control which production the membership belongs to.
    def perform_create(self, serializer):   

        production = Production.objects.get(  #Find production #id only if it belongs to the logged-in user's organization.
            pk=self.kwargs["pk"],
            organization=self.request.user.organization_memberships.organization,
        )

        serializer.save(production=production)


# internall CreatAPIView   just for understand purpose:
# def create(self, request, *args, **kwargs):
#     serializer = self.get_serializer(data=request.data)     =>serializer = ProductionMembershipSerializer(data=request.data)
#     serializer.is_valid(raise_exception=True)
#     self.perform_create(serializer)
#     headers = self.get_success_headers(seriaizer.data)
#     return Response(
#         serializer.data,
#         status=201,
#         headers=headers
#     )
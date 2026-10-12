from rest_framework import generics
from rest_framework.permissions import IsAuthenticated  #logged-in users can access these APIs.

from .models import Production
from .serializers import ProductionSerializer,ProductionMembershipSerializer
from .permissions import CanAccessProduction,IsProductionOwner,CanArchiveProduction,CanEditProduction,CanRestoreProduction

# for Production ARchieve:
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

#OrganizationMembership tells us which organization the user belongs to. 
#ProductionMembership tells us which productions that user is assigned to.



class ProductionListCreateView(generics.ListCreateAPIView):  #ListCreateAPIView combines two operations in one view: GET AND POST

    serializer_class = ProductionSerializer  #it tells DRF which serializer this view should use.(This tells DRF to use ProductionSerializer for incoming production data and outgoing responses.)
        #“For this view, use ProductionSerializer to convert Production model data into JSON and JSON data into Production data.”
        #Use ProductionSerializer ->  Convert/validate Production data

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsProductionOwner()]
        return [IsAuthenticated()]   #Only authenticated users can use this view

    def get_queryset(self):  #it tells the DRF, Which Production objects is this user allowed to work with?
        user = self.request.user   #is the currently authenticated Django user.(vignesh)
        membership = user.organization_memberships    #(vignesh-> oGC -> OWNER)

        # OWNER and ACCOUNTANT and Manager can see all productions
        if membership.role in [ "OWNER", "ACCOUNTANT","MANAGER"]:
            #Find all productions belonging to the organization associated with the logged-in user.
            return Production.objects.filter(    #if logged  user ia owner, he can see all productuons
                organization=membership.organization  # membership.organization = OGC Films (tehn django perform: FInd production  WHERE org=>OGC)
            )#The organization filter is important because it prevents the queryset from returning productions belonging to another organization.

        # Other users can see only productions what they are assigned to:
        return Production.objects.filter(
            #here, Suppose the logged-in user Arun-> belongs to OGC Films. Django filters out productions belonging to other organizations.
            organization=membership.organization,   #OGC Films(So productions from another organization cannot appear.)
            #Find productions whose ProductionMembership contains this user.
            memberships__user=user,   #(which means Production=>ProductionMembership=> user ) and __ menans foloow the relationship  to another model
        ).distinct()    #Avoid duplicate production results.
        #Suppose OGC Films has three productions:FilM A,B,C and arun is assigned to A and c only. whne arun logs in =>the queryset returns Film A and Film C. Film B is excluded because Arun has no assignment to it.
        #Both conditions must match:
                    # - The production belongs to Arun's organization.
                    # - Arun is assigned to that production.
                #This is how the queryset restricts results to the productions Arun is allowed to access.

    def perform_create(self, serializer):  #runs when a new Production is created.
        #This tells DRF to save the validated data as a new Production object.
        serializer.save(organization=self.request.user.organization_memberships.organization)  #This automatically attaches the new Production to the logged-in user's organization.
                     #Logged-in user = Vignesh and Organization = OGC Films
                     #now the user(vignesh) sends {name:FILM1 , code =001, satrt-date=..}
                     #save() means "Use this validated data to create the Production object and save that object to the database."
                        # so serializer.save() means : Tell the serializer to create/update the model object using the validated data.

class ProductionDetailView(generics.RetrieveUpdateAPIView):  #GET,PUT,PATCh
    serializer_class = ProductionSerializer  #DRF uses ProductionSerializer to validate incoming update data and convert the production object into JSON for the response.
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

    
    def get_queryset(self):   #retrive, update
        user = self.request.user  #retrieves the logged-in user.
        membership = user.organization_memberships  #retrieves that user's organization membership.

        # OWNER and ACCOUNTANT amd Manager  can access all productions
        if membership.role in ["OWNER","ACCOUNTANT","MANAGER"]:
            return Production.objects.filter(   # #if logged  user ia owner, he can see all productuons
                organization=membership.organization    # membership.organization = OGC Films(tehn django perform: FInd production  WHERE org=>OGC)
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

        production.status = "ARCHIVED"  #we're changing status from active to archrived. SO The database record remains
        production.save(update_fields=["status"])   #So instead of updating every field, Django only changes:status → ARCHIVED

        serializer = ProductionSerializer(production)  #Now we're giving the updated Production object to the serializer.So, it converts python obj to json

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    #So the key idea is: Archive does not remove the Production. It changes its status to ARCHIVED, preserving the financial history. 

class ProductionRestoreView(APIView):
    permission_classes = [IsAuthenticated,CanRestoreProduction,]

    def post(self, request, pk):
        membership = request.user.organization_memberships  #This retrieves the logged-in user's organization membership.

        production = get_object_or_404(  #retrieves a matching production. If no matching record exists, it raises an HTTP 404 response.
            Production,  #Django searches the Production table for a record that matches all three conditions:
            pk=pk,#the production ID must match the URL.
            organization=membership.organization,  #the production must belong to the logged-in user's organization.
            status=Production.Status.ARCHIVED, #the production must currently be archived.
        )

        production.status = Production.Status.PLANNED   
        production.save(update_fields=["status", "updated_at"])

        serializer = ProductionSerializer(production)  #This passes the updated Python model object to ProductionSerializer, which converts it into API-ready data.

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )




#This view is for assigning a user to a specific production.
class ProductionMembershipCreateView(generics.CreateAPIView):  #Receive data → validate it → create a ProductionMembership record.
    serializer_class = ProductionMembershipSerializer  #Use ProductionMembershipSerializer to validate and create the membership.
    permission_classes = [IsAuthenticated,IsProductionOwner,]  #only an authenticated OWNER can assign users to productions.

    def get_serializer_context(self):
        context = super().get_serializer_context()

        production = get_object_or_404(
            Production,
            pk=self.kwargs["pk"],
            organization=self.request.user.organization_memberships.organization,
        )
        
        # Pass the production to the serializer before validation.
        context["production"] = production

        return context

    #CreateAPIView automatically does:req->serializer validation->perform_create(serializer)->save.So we customize perform_create() to control which production the membership belongs to.
    def perform_create(self, serializer):   #a method you override to customize how the object is saved. 

        # Retrieve the production from the serializer context.
        production = serializer.context["production"]

        

        ##Create a membership record for nishok, give him the Director role, and link that record to Film ABC.
        serializer.save(production=production)  #production=production tells Django which production to attach to the new assignment.
                                            #Django found Film ABC and stored it in the variable production.

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
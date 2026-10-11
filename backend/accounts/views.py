from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.contrib.auth import get_user_model
User = get_user_model()

from .serializers import RegisterSerializer, LoginSerializer , CurrentOrganizationSerializer ,OrganizationInvitationSerializer,OrganizationInvitation,OrganizationInvitationDetailSerializer,AcceptOrganizationInvitationSerializer
from .models import OrganizationMembership


#for getting  new access token from refresh
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

#for csrf token
from django.middleware.csrf import get_token    #can generate/get a CSRF token.

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import ensure_csrf_cookie

@method_decorator(csrf_protect, name='dispatch') #csrf_protect is a Django function decorator
class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)  #we are handling the data coming from an api uisng serializer

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Registration successful.",
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "email": user.email,
                    }
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]    #can retrieve that user.

            refresh = RefreshToken.for_user(user)   #"Create a refresh token that belongs to this particular Django user(Refresh JWT containing user information)."
                                                    #The refresh token contains information identifying the user and token metadata.
            access_token = refresh.access_token    #Get the access token from the refresh token object.

            response = Response(
                {
                    "message": "Login successful.",
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "email": user.email,
                    }
                },
                status=status.HTTP_200_OK
            )

            # Store access token in HttpOnly cookie
            response.set_cookie(
                key="access_token",
                value=str(access_token),
                httponly=True,
                secure=False,       # True in production (HTTPS)
                samesite="Lax",
                max_age=60,        # 1 minute
            )

            # Store refresh token in HttpOnly cookie
            response.set_cookie(
                key="refresh_token",
                value=str(refresh),
                httponly=True,
                secure=False,       # True in production (HTTPS)
                samesite="Lax",
                max_age=86400,      # 1 day
            )

            return response

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# class ProtectedTestView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         return Response(
#             {
#                 "message": "You are authenticated.",
#                 "user": {
#                     "id": request.user.id,
#                     "email": request.user.email,
#                 }
#             },
#             status=status.HTTP_200_OK
#         )

@method_decorator(csrf_protect, name='dispatch')
class RefreshTokenView(APIView):
    authentication_classes = []    #does NOT require authentication(Don't try to authenticate this request using our normal JWT authentication., because the user is trying to get a new access token using a refresh token, and they might not have a valid access token yet.)
    permission_classes = [AllowAny]  #Anyone can call the  endpoint(Don't require the user to already be authenticated to call this endpoint.)

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")          #req.COOKIES: contains the browser's cookies."Give me the value of the refresh_token cookie."

        if not refresh_token:    #"Did the browser actually send a refresh token?"
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = TokenRefreshSerializer(   #, after getting refresh token : Give the refresh token to SimpleJWT
            data={"refresh": refresh_token}   #We're creating that structure ourselves because our refresh token came from a cookie.
        )

        try:
            serializer.is_valid(raise_exception=True)   #Now SimpleJWT checks the refresh token.its verify thins like valid JWT, signature, expiration, and whether it's blacklisted. If the token is invalid, it raises an exception.

            access_token = serializer.validated_data["access"]   #The refresh token is valid, so SimpleJWT generates a new access token.

            response = Response(
                {"message": "Access token refreshed."},
                status=status.HTTP_200_OK
            )

            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,       # True in production
                samesite="Lax",
                max_age=60,        # 1 minute
            )

            return response

        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or blacklisted."},
                status=status.HTTP_401_UNAUTHORIZED
            )


        
@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):   #when logout req happens
        refresh_token = request.COOKIES.get("refresh_token")  #Read refresh_token from cookie

        if refresh_token: 
            try:
                token = RefreshToken(refresh_token) #turns that string into a RefreshToken object that SimpleJWT can work with.
                                                    #for eg: refresh_token = "eyJ0eXAiOiJKV1QiLCJhbGciOi is like this. we need to turn it into a RefreshToken object so that we can call the blacklist() method on it. so RefreshToken(refresh_token) turns that string into a RefreshToken object that SimpleJWT can work with.
                token.blacklist()  #It can no longer be used to generate new access tokens
            except TokenError:
                pass

        response = Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK
        )

        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")

        return response


# Organization Identification API

class CurrentOrganizationView(APIView):   #Only a logged-in user can call this API.(Organization + organization role)
    permission_classes = [IsAuthenticated]

    def get(self, request):

        #"Find the organization membership belonging to the currently logged-in user, and fetch its organization along with it."
        membership = OrganizationMembership.objects.select_related('organization').get(user=request.user)
        #select_related() tells Django: "When you get the membership, get its organization at the same time."


         #Passes the membership to the serializer we just created.
        #The serializer extracts:organization.id , organization.name , membership.role
        serializer = CurrentOrganizationSerializer(membership)
       

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


#Current user:

class CurrentUserView(APIView):    #Only logged-in users can call it.   (User information )
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "id": user.id,
                "first_name": user.first_name,
                "email": user.email,
            },
            status=status.HTTP_200_OK
        )


#csrf token view
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]  #Anyone can call this endpoint because the user doesn't need to be logged in just to obtain a CSRF token.

    def get(self, request):  #when react call this endpoint, Django generates a CSRF token and sends it back in the response.
        return Response(
            {
                "csrfToken": get_token(request)
            },
            status=status.HTTP_200_OK
        )




#for invitation:
class CreateOrganizationInvitationView(APIView):

    permission_classes = [IsAuthenticated]  #Only authenticated users can access it.

    def post(self, request):

        #1 Get the current user's organization membership  (Find the user's organization)
        membership = OrganizationMembership.objects.select_related('organization').get(user=request.user)     #it finds: Current User → OrganizationMembership → Organization (Nishok=>Owner=>OGC)

        # 2Only the organization owner can invite staff
        if membership.role != OrganizationMembership.Role.OWNER:    #Only the OWNER can send invitations.
            return Response(
                {
                    "detail": "Only the organization owner can invite staff."
                },
                status=status.HTTP_403_FORBIDDEN
            )


        # 3. Normalize the email address
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {
                    "email": ["Email address is required."]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Check whether this email already belongs to a registered user
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {
                    "detail": "A user with this email address already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Check whether a pending invitation already exists
        existing_invitation = OrganizationInvitation.objects.filter(
            organization=membership.organization,
            email__iexact=email,
            status=OrganizationInvitation.Status.PENDING,
            expires_at__gt=timezone.now()
        ).exists()

        if existing_invitation:
            return Response(
                {
                    "detail": (
                        "A pending invitation already exists for "
                        "this email address."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        # 6. Validate the invitation data
        serializer = OrganizationInvitationSerializer(data=request.data)    #Validate invitation data(data comes from frontend)
        serializer.is_valid(raise_exception=True)

           # 7. Create the invitation with a seven-day expiry
        invitation = serializer.save(organization=membership.organization,expires_at=timezone.now() + timedelta(days=7))  #Nishok does not send:organization adn expiry at. The backend automatically adds them.  

        return Response(
            {
                "message": "Invitation created successfully.",
                "invitation_id": invitation.id,
                "email": invitation.email,
                "organization": invitation.organization.name,
                "role": invitation.role,
                "status": invitation.status,
            },
            status=status.HTTP_201_CREATED
        )



#This view is the GET API that Arun's browser calls when he opens the invitation link.
      #Token → find invitation → validate invitation → return details to React.
class OrganizationInvitationDetailView(APIView):  #Creates a custom API view for getting invitation details.
    permission_classes = [AllowAny]   #Arun is not logged in yet, so anyone with a valid invitation link must be able to access this API.

    def get(self, request, token):
        try:
            invitation = OrganizationInvitation.objects.select_related('organization').get(token=token)
                       #here, OrganizationInvitation=> is the model dB.("Work with the database table represented by my OrganizationInvitation model.")
                       #OrganizationInvitation.objects=>It allows us to query the table.
                                    #for eg: OrganizationInvitation.objects.all()=>Give me all invitation records
                                    #but we used OrganizationInvitation.objects.select_related('organization') which means , invitaion model has Organsiation foriegn key. so every invitation is connected to an organization.
                                    #select_related('organization') tells Django: "While getting the invitation, also fetch its organization."
                                    #.get(token=token)   => This is the actual search.   so , The URL might be : /invitations/abc-123-xyz/
                       #Find the one invitation whose database token equals abc-123-xyz. if found ,invitation=>contains actual invitiation obj

        except OrganizationInvitation.DoesNotExist:  #"If Django couldn't find an invitation matching that token, handle that situation here."  
            return Response(
                {"detail": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        #Check invitation status:     We only allow PENDING invitations.if its already expire,cancelled,or accepted: then i cannot be used
        if invitation.status != OrganizationInvitation.Status.PENDING:   #Returns 400.
            #invitation.status= pending(Earlier we fetched the invitation:epresents the  invitation record from the database.)
            #OrganizationInvitation.Status.PENDING => In your model you defined:  PENDING = 'PENDING', 'Pending'. so , orgInvaitation.staus=pending
              #so both side pending != pending.(its false) so its continue to next if. supeose (accepted!=pending means true)=> false and return 400
            return Response(
                {"detail": "This invitation is no longer valid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        #Checks whether the invitation's expiry time has passed.
        if invitation.expires_at <= timezone.now():  #It stores when the invitation should expire. for eg :expires_at = 15 October 2026, 5:00 PM
                                    #timezone.now() => Get the current date and time from Django.
            return Response({"detail": "This invitation has expired."},status=status.HTTP_400_BAD_REQUEST)

        serializer = OrganizationInvitationDetailSerializer(invitation)  #Takes the invitation database object and converts it into the JSON format we defined.
        return Response(serializer.data,status=status.HTTP_200_OK)
    #React receives something like:{
#     "email": "arun@gmail.com",
#     "first_name": "Arun",
#     "last_name": "Kumar",
#     "organization_name": "OGC Productions",
#     "role": "ACCOUNTANT",
#     "status": "PENDING",
#     "expires_at": "2026-10-15T..."
# }
    #This view does not create Arun's account. It only verifies the invitation and gives React the information needed to display the onboarding form.

    


#When Arun submits the invitation form:
class AcceptOrganizationInvitationView(APIView):
    permission_classes = [AllowAny]
  
    @transaction.atomic             #All the database operations inside this view should succeed together. Create User=>Create Membership=>Mark Invitation Accepted
    def post(self, request, token):

        try:
            invitation = OrganizationInvitation.objects.select_for_update().get(token=token)    #We use the token from the URL.
                                    #OrganizationInvitation is a db model and .objects get the data from db.
                                    #OrganizationInvitation.objects.select_for_update()-> it tells the db: Lock this invitation record while I'm processing it."
                                    #Imagine Arun accidentally clicks Accept twice at almost the same time:
                                            #Request 1 → Accept invitation
                                            #Request 2 → Accept invitation
                                    #Without the lock, both requests might try to process the same invitation.
                                    #select_for_update() locks this invitation row while this transaction is running.This helps prevent two requests accepting the same invitation at the same time.
                                    #.get(token=token)=>Find the invitation whose token matches the token from the URL.
                        #now we store the invitation obj in invitation var and we can able to access invitiation.email,status,role,organisation etc

        except OrganizationInvitation.DoesNotExist:
            return Response(
                {"detail": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Invitation must still be pending
        if invitation.status != OrganizationInvitation.Status.PENDING:  #Only a PENDING invitation can be accepted.
            return Response(
                {"detail": "This invitation is no longer valid."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Invitation must not be expired
        if invitation.expires_at <= timezone.now():     #if expire<today date return 400
            return Response(
                {"detail": "This invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the onboarding data
        serializer = AcceptOrganizationInvitationSerializer(data=request.data)   #here AcceptOrganizationInvitationSerializer will run with the req.data(which the data sumbitted by user )

        serializer.is_valid(raise_exception=True)

        # Get the invited email from the invitation
        email = invitation.email  #We do not take the email from React.  (The email comes from the trusted invitation record.)=>we hav inviation var ...

        # Prevent creating another account with the same email (Check existing account)
        if User.objects.filter(email=email).exists():
            return Response(
                {
                    "detail": "An account with this email already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the validated onboarding data (validated_data contains the data after the serializer has successfully validated it.)
        #These three lines take the validated form data from AcceptOrganizationInvitationSerializer and store each value in a normal Python variable.
        first_name = serializer.validated_data["first_name"]
        last_name = serializer.validated_data["last_name"]
        password = serializer.validated_data["password"]

        # Create the user account(Now Django creates Arun's account.)
        user = User.objects.create_user(  #create_user() hashes the password before storing it.
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password
        )

        # Create organization membership using invitation details(The organization and role come from the invitation, not the frontend.)
        OrganizationMembership.objects.create(
            user=user,
            organization=invitation.organization,
            role=invitation.role
        )

        # Mark invitation as accepted
        invitation.status = OrganizationInvitation.Status.ACCEPTED
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["status", "accepted_at"])

        return Response(
            {
                "message": "Invitation accepted successfully.",
                "email": user.email,
                "organization": invitation.organization.name,
                "role": invitation.role,
            },
            status=status.HTTP_201_CREATED
        )
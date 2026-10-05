from django.conf.locale import he
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import AllowAny

from .serializers import RegisterSerializer, LoginSerializer , CurrentOrganizationSerializer
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

class CurrentOrganizationView(APIView):
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

class CurrentUserView(APIView):
    
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
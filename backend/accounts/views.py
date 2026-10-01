from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import RegisterSerializer, LoginSerializer , CurrentOrganizationSerializer
from .models import OrganizationMembership


#for getting  new access token from refresh
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

#Create Tenant Isolation Test API
# from .services import get_user_organization



class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

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



class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "email": user.email,
                    }
                },
                status=status.HTTP_200_OK
            )

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


class RefreshTokenView(APIView):

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)

            return Response(
                serializer.validated_data,
                status=status.HTTP_200_OK
            )

        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or blacklisted."},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logout successful."},
                status=status.HTTP_200_OK
            )

        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )



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


# class TenantIsolationTestView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         organization = get_user_organization(request.user)

#         return Response(
#             {
#                 "user": request.user.email,
#                 "organization_id": organization.id,
#                 "organization_name": organization.name,
#                 "message": "User can access their organization."
#             },
#             status=status.HTTP_200_OK
#         )
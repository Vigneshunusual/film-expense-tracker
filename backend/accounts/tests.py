
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Organization, OrganizationMembership


# ============================================================
# 1. JWT AUTHENTICATION INTEGRATION TESTS
# ============================================================

class JWTAuthenticationTests(APITestCase):

    def setUp(self):

        # Enable CSRF checks in the Django test client.
        self.client = self.client_class(enforce_csrf_checks=True)

        # Create organization.
        self.organization = Organization.objects.create(
            name="Authentication Test Organization"
        )

        # Create test user.
        self.user = User.objects.create_user(
            username="authtest",
            email="authtest@test.com",
            first_name="Auth Test",
            password="StrongTestPassword123!"
        )

        # Create organization membership.
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.organization,
            role=OrganizationMembership.Role.OWNER
        )

        # API endpoints.
        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/refresh/"
        self.logout_url = "/api/auth/logout/"
        self.csrf_url = "/api/auth/csrf/"
        self.me_url = "/api/auth/me/"

        self.credentials = {
            "email": "authtest@test.com",
            "password": "StrongTestPassword123!"
        }

    # --------------------------------------------------------
    # LOGIN TESTS
    # --------------------------------------------------------

    def test_login_with_valid_credentials(self):

        # Obtain CSRF cookie before login.
        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("access_token", response.cookies)
        self.assertIn("refresh_token", response.cookies)

    def test_login_with_invalid_credentials(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            self.login_url,
            {
                "email": "authtest@test.com",
                "password": "WrongPassword123!"
            },
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_login_requires_csrf_token(self):

        response = self.client.post(
            self.login_url,
            self.credentials,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # COOKIE SECURITY TESTS
    # --------------------------------------------------------

    def test_access_cookie_is_httponly(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertTrue(
            response.cookies["access_token"]["httponly"]
        )

    def test_refresh_cookie_is_httponly(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertTrue(
            response.cookies["refresh_token"]["httponly"]
        )

    # --------------------------------------------------------
    # PROTECTED API TESTS
    # --------------------------------------------------------

    def test_authenticated_user_can_access_me_api(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        login_response = self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            login_response.status_code,
            status.HTTP_200_OK
        )

        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            response.data["email"],
            self.user.email
        )

    def test_unauthenticated_user_cannot_access_me_api(self):

        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_invalid_access_cookie_is_rejected(self):

        self.client.cookies["access_token"] = "invalid.jwt.token"

        response = self.client.get(self.me_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    # --------------------------------------------------------
    # REFRESH TOKEN TESTS
    # --------------------------------------------------------

    def test_refresh_with_valid_refresh_cookie(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("access_token", response.cookies)

    def test_refresh_without_refresh_cookie_is_rejected(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_refresh_with_invalid_token_is_rejected(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        self.client.cookies["refresh_token"] = "invalid.refresh.token"

        response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_refresh_requires_csrf_token(self):

        self.client.cookies["refresh_token"] = str(
            RefreshToken.for_user(self.user)
        )

        response = self.client.post(
            self.refresh_url,
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # LOGOUT TESTS
    # --------------------------------------------------------

    def test_logout_with_valid_refresh_cookie(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        refresh_token = self.client.cookies["refresh_token"].value

        response = self.client.post(
            self.logout_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        # Refresh token should no longer be usable.
        self.client.cookies["refresh_token"] = refresh_token

        refresh_response = self.client.post(
            self.refresh_url,
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            refresh_response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_requires_csrf_token(self):

        refresh_token = str(
            RefreshToken.for_user(self.user)
        )

        self.client.cookies["refresh_token"] = refresh_token

        response = self.client.post(
            self.logout_url,
            {},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # CSRF TOKEN TESTS
    # --------------------------------------------------------

    def test_csrf_endpoint_returns_token(self):

        response = self.client.get(self.csrf_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("csrfToken", response.data)

        self.assertIn("csrftoken", response.cookies)

    def test_unsafe_request_with_valid_csrf_token_is_allowed(self):

        self.client.get(self.csrf_url)

        csrf_token = self.client.cookies["csrftoken"].value

        self.client.post(
            self.login_url,
            self.credentials,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        # Authenticated POST request with valid CSRF token.
        response = self.client.post(
            "/api/auth/logout/",
            {},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

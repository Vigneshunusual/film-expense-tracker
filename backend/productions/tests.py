from datetime import date

from django.test import TestCase
from django.db import IntegrityError, transaction

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import User, Organization, OrganizationMembership
from .models import Production


# ============================================================
# 1. PRODUCTION MODEL TESTS
# ============================================================

class ProductionModelTests(TestCase):

    def setUp(self):
        self.organization = Organization.objects.create(
            name="Test Organization"
        )

    def create_production(
        self,
        name="Test Film",
        code="FILM-001",
        start_date=date(2026, 1, 1),
        end_date=None,
        production_status=None,
    ):
        data = {
            "organization": self.organization,
            "name": name,
            "code": code,
            "start_date": start_date,
            "end_date": end_date,
        }

        if production_status is not None:
            data["status"] = production_status

        return Production.objects.create(**data)

    def test_production_creation(self):
        production = self.create_production()

        self.assertEqual(production.name, "Test Film")
        self.assertEqual(production.code, "FILM-001")
        self.assertEqual(production.organization, self.organization)

    def test_default_status_is_planned(self):
        production = self.create_production()

        self.assertEqual(
            production.status,
            Production.Status.PLANNED,
        )

    def test_production_status_choices(self):
        expected = {
            "PLANNED",
            "ACTIVE",
            "COMPLETED",
            "ARCHIVED",
        }

        actual = {
            value for value, label in Production.Status.choices
        }

        self.assertEqual(actual, expected)

    def test_production_string_representation(self):
        production = self.create_production()

        self.assertEqual(
            str(production),
            "Test Film (FILM-001)",
        )

    def test_production_code_unique_within_organization(self):
        self.create_production(code="FILM-001")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.create_production(
                    name="Another Film",
                    code="FILM-001",
                )

    def test_same_code_allowed_in_different_organizations(self):
        self.create_production(code="FILM-001")

        another_organization = Organization.objects.create(
            name="Another Organization"
        )

        production = Production.objects.create(
            organization=another_organization,
            name="Another Film",
            code="FILM-001",
            start_date=date(2026, 2, 1),
        )

        self.assertEqual(production.code, "FILM-001")

    def test_production_can_have_null_end_date(self):
        production = self.create_production(end_date=None)

        self.assertIsNone(production.end_date)

    def test_production_can_have_valid_end_date(self):
        production = self.create_production(
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
        )

        self.assertEqual(
            production.end_date,
            date(2026, 12, 31),
        )


# ============================================================
# 2. PRODUCTION API TESTS
# ============================================================

class ProductionAPITests(APITestCase):

    def setUp(self):

        self.organization = Organization.objects.create(
            name="API Test Organization"
        )

        # Create users

        self.owner = User.objects.create_user(
            username="apiowner",
            email="apiowner@test.com",
            password="TestPassword123!",
        )

        self.manager = User.objects.create_user(
            username="apimanager",
            email="apimanager@test.com",
            password="TestPassword123!",
        )

        self.accountant = User.objects.create_user(
            username="apiaccountant",
            email="apiaccountant@test.com",
            password="TestPassword123!",
        )

        # Organization memberships

        OrganizationMembership.objects.create(
            user=self.owner,
            organization=self.organization,
            role=OrganizationMembership.Role.OWNER,
        )

        OrganizationMembership.objects.create(
            user=self.manager,
            organization=self.organization,
            role=OrganizationMembership.Role.MANAGER,
        )

        OrganizationMembership.objects.create(
            user=self.accountant,
            organization=self.organization,
            role=OrganizationMembership.Role.ACCOUNTANT,
        )

        # Productions

        self.production1 = Production.objects.create(
            organization=self.organization,
            name="API Test Film One",
            code="API-001",
            start_date="2026-01-01",
        )

        self.production2 = Production.objects.create(
            organization=self.organization,
            name="API Test Film Two",
            code="API-002",
            start_date="2026-02-01",
        )

        self.production_url = "/api/productions/"

    # --------------------------------------------------------
    # PRODUCTION CREATION
    # --------------------------------------------------------

    def test_owner_can_create_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "New Film",
                "code": "API-003",
                "start_date": "2026-03-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Production.objects.filter(
                organization=self.organization,
                code="API-003",
            ).exists()
        )

    def test_manager_cannot_create_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            self.production_url,
            {
                "name": "Unauthorized Film",
                "code": "API-004",
                "start_date": "2026-03-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_accountant_cannot_create_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            self.production_url,
            {
                "name": "Accountant Film",
                "code": "API-005",
                "start_date": "2026-03-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------------
    # PRODUCTION LIST
    # --------------------------------------------------------

    def test_owner_can_view_all_productions(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.production_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_manager_can_view_all_productions(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.get(self.production_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_accountant_can_view_all_productions(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.get(self.production_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    # --------------------------------------------------------
    # PRODUCTION DETAILS
    # --------------------------------------------------------

    def test_owner_can_view_production_details(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_manager_can_view_production_details(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_accountant_can_view_production_details(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --------------------------------------------------------
    # PRODUCTION UPDATE
    # --------------------------------------------------------

    def test_owner_can_update_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {"name": "Updated Film"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.production1.refresh_from_db()

        self.assertEqual(self.production1.name, "Updated Film")

    def test_manager_can_update_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {"name": "Manager Updated Film"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_accountant_cannot_update_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {"name": "Unauthorized Update"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------------
    # PRODUCTION LIFECYCLE
    # --------------------------------------------------------

    def test_owner_can_activate_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/activate/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.ACTIVE,
        )

    def test_manager_cannot_activate_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/activate/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_accountant_cannot_activate_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/activate/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_owner_can_complete_active_production(self):

        self.production1.status = Production.Status.ACTIVE
        self.production1.save()

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/complete/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.COMPLETED,
        )

    def test_owner_cannot_complete_planned_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/complete/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # ARCHIVE AND RESTORE
    # --------------------------------------------------------

    def test_owner_can_archive_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/archive/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.ARCHIVED,
        )

    def test_manager_cannot_archive_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_accountant_cannot_archive_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_owner_can_restore_archived_production(self):

        self.production1.status = Production.Status.ARCHIVED
        self.production1.save()

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/restore/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.PLANNED,
        )

    def test_manager_cannot_restore_production(self):

        self.production1.status = Production.Status.ARCHIVED
        self.production1.save()

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/restore/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_accountant_cannot_restore_production(self):

        self.production1.status = Production.Status.ARCHIVED
        self.production1.save()

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/restore/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    def test_duplicate_production_code_rejected(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "Duplicate Film",
                "code": "API-001",
                "start_date": "2026-03-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_invalid_production_dates_rejected(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "Invalid Date Film",
                "code": "API-006",
                "start_date": "2026-12-31",
                "end_date": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_status_cannot_be_changed_directly(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {"status": "ACTIVE"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_archived_production_cannot_be_edited(self):

        self.production1.status = Production.Status.ARCHIVED
        self.production1.save()

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {"name": "Attempted Update"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    # --------------------------------------------------------
    # TENANT ISOLATION
    # --------------------------------------------------------

    def test_user_cannot_access_another_organization_production(self):

        another_organization = Organization.objects.create(
            name="Another Organization"
        )

        another_user = User.objects.create_user(
            username="anotherowner",
            email="anotherowner@test.com",
            password="TestPassword123!",
        )

        OrganizationMembership.objects.create(
            user=another_user,
            organization=another_organization,
            role=OrganizationMembership.Role.OWNER,
        )

        another_production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-001",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            f"{self.production_url}{another_production.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_production_list_only_contains_own_organization(self):

        another_organization = Organization.objects.create(
            name="Second Organization"
        )

        Production.objects.create(
            organization=another_organization,
            name="Other Organization Film",
            code="OTHER-002",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.production_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_owner_cannot_update_another_organization_production(self):

        another_organization = Organization.objects.create(
            name="Third Organization"
        )

        production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-003",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{production.id}/",
            {"name": "Unauthorized Update"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        production.refresh_from_db()

        self.assertEqual(production.name, "Other Film")

    def test_owner_cannot_archive_another_organization_production(self):

        another_organization = Organization.objects.create(
            name="Fourth Organization"
        )

        production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-004",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{production.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        production.refresh_from_db()

        self.assertEqual(
            production.status,
            Production.Status.PLANNED,
        )

    # --------------------------------------------------------
    # AUTHENTICATION
    # --------------------------------------------------------

    def test_unauthenticated_user_cannot_list_productions(self):

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_unauthenticated_user_cannot_create_production(self):

        response = self.client.post(
            self.production_url,
            {
                "name": "Unauthorized Film",
                "code": "UNAUTH-001",
                "start_date": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
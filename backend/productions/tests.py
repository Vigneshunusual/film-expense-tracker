
from datetime import date

from django.test import TestCase
from django.db import IntegrityError, transaction

from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import (User,Organization,OrganizationMembership,)

from .models import Production, ProductionMembership


    # ============================================================
    # 1. PRODUCTION MODEL TESTS
    # ============================================================

class ProductionModelTests(TestCase):

    def setUp(self):
        self.organization = Organization.objects.create(
            name="Test Organization"
        )

        self.user = User.objects.create_user(
            username="testowner",
            email="owner@test.com",
            password="TestPassword123!"
        )

    def create_production(
        self,
        name="Test Film",
        code="FILM-001",
        start_date=date(2026, 1, 1),
        end_date=None,
        status=None
    ):
        production_data = {
            "organization": self.organization,
            "name": name,
            "code": code,
            "start_date": start_date,
            "end_date": end_date,
        }

        if status is not None:
            production_data["status"] = status

        return Production.objects.create(**production_data)

    def test_production_creation(self):
        production = self.create_production()

        self.assertEqual(production.name, "Test Film")
        self.assertEqual(production.code, "FILM-001")
        self.assertEqual(production.organization, self.organization)

    def test_default_status_is_planned(self):
        production = self.create_production()

        self.assertEqual(
            production.status,
            Production.Status.PLANNED
        )

    def test_production_status_choices(self):
        expected_statuses = {
            "PLANNED",
            "ACTIVE",
            "COMPLETED",
            "ARCHIVED",
        }

        actual_statuses = {
            value for value, label in Production.Status.choices
        }

        self.assertEqual(actual_statuses, expected_statuses)

    def test_production_string_representation(self):
        production = self.create_production()

        self.assertEqual(
            str(production),
            "Test Film (FILM-001)"
        )

    def test_production_code_must_be_unique_within_organization(self):
        self.create_production(code="FILM-001")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.create_production(
                    name="Another Film",
                    code="FILM-001"
                )

    def test_same_production_code_allowed_in_different_organizations(self):
        self.create_production(code="FILM-001")

        another_organization = Organization.objects.create(
            name="Another Test Organization"
        )

        production = Production.objects.create(
            organization=another_organization,
            name="Another Film",
            code="FILM-001",
            start_date=date(2026, 2, 1)
        )

        self.assertEqual(production.code, "FILM-001")
        self.assertEqual(
            production.organization,
            another_organization
        )

    def test_production_can_have_null_end_date(self):
        production = self.create_production(end_date=None)

        self.assertIsNone(production.end_date)

    def test_production_can_have_valid_end_date(self):
        production = self.create_production(
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31)
        )

        self.assertEqual(
            production.end_date,
            date(2026, 12, 31)
        )


# ============================================================
# 2. PRODUCTION MEMBERSHIP MODEL TESTS
# ============================================================

class ProductionMembershipModelTests(TestCase):

    def setUp(self):
        self.organization = Organization.objects.create(
            name="Membership Test Organization"
        )

        self.user = User.objects.create_user(
            username="teststaff",
            email="staff@test.com",
            password="TestPassword123!"
        )

        self.production = Production.objects.create(
            organization=self.organization,
            name="Membership Test Film",
            code="MEM-001",
            start_date=date(2026, 1, 1)
        )

    def test_production_membership_creation(self):
        membership = ProductionMembership.objects.create(
            production=self.production,
            user=self.user,
            role=ProductionMembership.Role.STAFF
        )

        self.assertEqual(membership.production, self.production)
        self.assertEqual(membership.user, self.user)
        self.assertEqual(
            membership.role,
            ProductionMembership.Role.STAFF
        )

    def test_production_membership_string_representation(self):
        membership = ProductionMembership.objects.create(
            production=self.production,
            user=self.user,
            role=ProductionMembership.Role.STAFF
        )

        self.assertEqual(
            str(membership),
            "staff@test.com - Membership Test Film (STAFF)"
        )

    def test_duplicate_user_assignment_is_rejected(self):
        ProductionMembership.objects.create(
            production=self.production,
            user=self.user,
            role=ProductionMembership.Role.STAFF
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProductionMembership.objects.create(
                    production=self.production,
                    user=self.user,
                    role=ProductionMembership.Role.DIRECTOR
                )


# ============================================================
# 3. PRODUCTION API TESTS
# ============================================================

class ProductionAPITests(APITestCase):

    def setUp(self):

        self.organization = Organization.objects.create(
            name="API Test Organization"
        )

        # Users

        self.owner = User.objects.create_user(
            username="apiowner",
            email="apiowner@test.com",
            password="TestPassword123!"
        )

        self.manager = User.objects.create_user(
            username="apimanager",
            email="apimanager@test.com",
            password="TestPassword123!"
        )

        self.accountant = User.objects.create_user(
            username="apiaccountant",
            email="apiaccountant@test.com",
            password="TestPassword123!"
        )

        self.member = User.objects.create_user(
            username="apimember",
            email="apimember@test.com",
            password="TestPassword123!"
        )

        # Organization memberships

        OrganizationMembership.objects.create(
            user=self.owner,
            organization=self.organization,
            role=OrganizationMembership.Role.OWNER
        )

        OrganizationMembership.objects.create(
            user=self.manager,
            organization=self.organization,
            role=OrganizationMembership.Role.MANAGER
        )

        OrganizationMembership.objects.create(
            user=self.accountant,
            organization=self.organization,
            role=OrganizationMembership.Role.ACCOUNTANT
        )

        OrganizationMembership.objects.create(
            user=self.member,
            organization=self.organization,
            role=OrganizationMembership.Role.MEMBER
        )

        # Productions

        self.production1 = Production.objects.create(
            organization=self.organization,
            name="API Test Film One",
            code="API-001",
            start_date="2026-01-01"
        )

        self.production2 = Production.objects.create(
            organization=self.organization,
            name="API Test Film Two",
            code="API-002",
            start_date="2026-02-01"
        )

        # Assign member to production1 only

        ProductionMembership.objects.create(
            production=self.production1,
            user=self.member,
            role=ProductionMembership.Role.STAFF
        )

        self.production_url = "/api/productions/"

    # --------------------------------------------------------
    # PRODUCTION CREATE
    # --------------------------------------------------------

    def test_owner_can_create_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "New API Film",
                "code": "API-003",
                "start_date": "2026-03-01"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            Production.objects.filter(
                organization=self.organization,
                code="API-003"
            ).count(),
            1
        )

    def test_manager_cannot_create_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            self.production_url,
            {
                "name": "Unauthorized Film",
                "code": "API-004",
                "start_date": "2026-03-01"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # PRODUCTION LIST
    # --------------------------------------------------------

    def test_owner_can_view_all_organization_productions(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 2)

    def test_manager_can_view_all_organization_productions(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 2)

    def test_accountant_can_view_all_organization_productions(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 2)

    def test_member_can_view_only_assigned_productions(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 1)

        self.assertEqual(
            response.data[0]["id"],
            self.production1.id
        )

    # --------------------------------------------------------
    # PRODUCTION DETAIL
    # --------------------------------------------------------

    def test_owner_can_view_production_details(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_member_can_view_assigned_production(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_member_cannot_view_unassigned_production(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.get(
            f"{self.production_url}{self.production2.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    # --------------------------------------------------------
    # PRODUCTION UPDATE
    # --------------------------------------------------------

    def test_manager_can_update_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {
                "name": "Updated Film Name"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.name,
            "Updated Film Name"
        )

    def test_accountant_cannot_update_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {
                "name": "Unauthorized Update"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_member_cannot_update_production(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f"{self.production_url}{self.production1.id}/",
            {
                "name": "Unauthorized Update"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # ARCHIVE AND RESTORE
    # --------------------------------------------------------

    def test_owner_can_archive_production(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.ARCHIVED
        )

    def test_manager_cannot_archive_production(self):

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_owner_can_restore_archived_production(self):

        self.production1.status = Production.Status.ARCHIVED
        self.production1.save()

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/restore/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.production1.refresh_from_db()

        self.assertEqual(
            self.production1.status,
            Production.Status.PLANNED
        )

    # --------------------------------------------------------
    # MEMBER ASSIGNMENT
    # --------------------------------------------------------

    def test_owner_can_assign_member_to_production(self):

        new_staff = User.objects.create_user(
            username="newstaff",
            email="newstaff@test.com",
            password="TestPassword123!"
        )

        OrganizationMembership.objects.create(
            user=new_staff,
            organization=self.organization,
            role=OrganizationMembership.Role.MEMBER
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/members/",
            {
                "user": new_staff.id,
                "role": "STAFF"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            ProductionMembership.objects.filter(
                production=self.production1,
                user=new_staff
            ).exists()
        )

    def test_manager_cannot_assign_member_to_production(self):

        new_staff = User.objects.create_user(
            username="anotherstaff",
            email="anotherstaff@test.com",
            password="TestPassword123!"
        )

        OrganizationMembership.objects.create(
            user=new_staff,
            organization=self.organization,
            role=OrganizationMembership.Role.MEMBER
        )

        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"{self.production_url}{self.production1.id}/members/",
            {
                "user": new_staff.id,
                "role": "STAFF"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # ORGANIZATION ISOLATION
    # --------------------------------------------------------

    def test_user_cannot_access_another_organizations_production(self):

        another_organization = Organization.objects.create(
            name="Another API Organization"
        )

        another_user = User.objects.create_user(
            username="anotherowner",
            email="anotherowner@test.com",
            password="TestPassword123!"
        )

        OrganizationMembership.objects.create(
            user=another_user,
            organization=another_organization,
            role=OrganizationMembership.Role.OWNER
        )

        self.client.force_authenticate(user=another_user)

        response = self.client.get(
            f"{self.production_url}{self.production1.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_see_another_organizations_productions_in_list(self):

        another_organization = Organization.objects.create(
            name="Second Test Organization"
    )

        Production.objects.create(
            organization=another_organization,
            name="Another Organization Film",
            code="OTHER-001",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.get(self.production_url)

        self.assertEqual(
        response.status_code,
        status.HTTP_200_OK
    )

        self.assertEqual(len(response.data), 2)

        returned_ids = [item["id"] for item in response.data]

        self.assertNotIn(
            Production.objects.get(code="OTHER-001").id,
            returned_ids
    )

    # --------------------------------------------------------
    # AUTHENTICATION
    # --------------------------------------------------------

    def test_unauthenticated_user_cannot_list_productions(self):

        self.client.force_authenticate(user=None)

        response = self.client.get(self.production_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


# ============================================================
# 4. PRODUCTION API EDGE-CASE TESTS
# ============================================================

class ProductionAPIEdgeCaseTests(APITestCase):

    def setUp(self):

        self.organization = Organization.objects.create(
            name="Edge Case Organization"
        )

        # Users

        self.owner = User.objects.create_user(
            username="edgeowner",
            email="edgeowner@test.com",
            password="TestPassword123!"
        )

        self.manager = User.objects.create_user(
            username="edgemanager",
            email="edgemanager@test.com",
            password="TestPassword123!"
        )

        self.accountant = User.objects.create_user(
            username="edgeaccountant",
            email="edgeaccountant@test.com",
            password="TestPassword123!"
        )

        self.member = User.objects.create_user(
            username="edgemember",
            email="edgemember@test.com",
            password="TestPassword123!"
        )

        # Organization memberships

        OrganizationMembership.objects.create(
            user=self.owner,
            organization=self.organization,
            role=OrganizationMembership.Role.OWNER
        )

        OrganizationMembership.objects.create(
            user=self.manager,
            organization=self.organization,
            role=OrganizationMembership.Role.MANAGER
        )

        OrganizationMembership.objects.create(
            user=self.accountant,
            organization=self.organization,
            role=OrganizationMembership.Role.ACCOUNTANT
        )

        OrganizationMembership.objects.create(
            user=self.member,
            organization=self.organization,
            role=OrganizationMembership.Role.MEMBER
        )

        # Production

        self.production = Production.objects.create(
            organization=self.organization,
            name="Edge Test Film",
            code="EDGE-001",
            start_date="2026-01-01"
        )

        ProductionMembership.objects.create(
            production=self.production,
            user=self.member,
            role=ProductionMembership.Role.STAFF
        )

        self.production_url = "/api/productions/"

    # --------------------------------------------------------
    # DUPLICATE PRODUCTION CODE
    # --------------------------------------------------------

    def test_duplicate_production_code_rejected_through_api(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "Duplicate Film",
                "code": "EDGE-001",
                "start_date": "2026-03-01"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------------
    # INVALID PRODUCTION DATES
    # --------------------------------------------------------

    def test_invalid_production_dates_rejected(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            self.production_url,
            {
                "name": "Invalid Date Film",
                "code": "EDGE-002",
                "start_date": "2026-12-31",
                "end_date": "2026-01-01"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------------
    # INVALID MEMBER ASSIGNMENT
    # --------------------------------------------------------

    def test_invalid_member_assignment_rejected(self):

        outsider = User.objects.create_user(
            username="edgeoutsider",
            email="edgeoutsider@test.com",
            password="TestPassword123!"
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production.id}/members/",
            {
                "user": outsider.id,
                "role": "STAFF"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------------
    # DUPLICATE MEMBER ASSIGNMENT
    # --------------------------------------------------------

    def test_duplicate_member_assignment_rejected_through_api(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{self.production.id}/members/",
            {
                "user": self.member.id,
                "role": "DIRECTOR"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------------------------------
    # ACCOUNTANT ARCHIVE RESTRICTION
    # --------------------------------------------------------

    def test_accountant_cannot_archive_production(self):

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            f"{self.production_url}{self.production.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # MEMBER ARCHIVE RESTRICTION
    # --------------------------------------------------------

    def test_member_cannot_archive_production(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            f"{self.production_url}{self.production.id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # ACCOUNTANT RESTORE RESTRICTION
    # --------------------------------------------------------

    def test_accountant_cannot_restore_production(self):

        self.production.status = Production.Status.ARCHIVED
        self.production.save()

        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            f"{self.production_url}{self.production.id}/restore/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    # --------------------------------------------------------
    # ARCHIVED PRODUCTION UPDATE
    # --------------------------------------------------------

    def test_archived_production_cannot_be_edited(self):

        self.production.status = Production.Status.ARCHIVED
        self.production.save()

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{self.production.id}/",
            {
                "name": "Attempted Archived Update"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.production.refresh_from_db()

        self.assertEqual(
            self.production.name,
            "Edge Test Film"
        )

    # --------------------------------------------------------
    # ARCHIVED PRODUCTION MEMBER ASSIGNMENT
    # --------------------------------------------------------

    def test_archived_production_cannot_receive_new_members(self):

        # Create a new user belonging to the same organization.
        new_staff = User.objects.create_user(
            username="archivedstaff",
            email="archivedstaff@test.com",
            password="TestPassword123!"
        )

        OrganizationMembership.objects.create(
            user=new_staff,
            organization=self.organization,
            role=OrganizationMembership.Role.MEMBER
        )

        # Archive the production.
        self.production.status = Production.Status.ARCHIVED
        self.production.save()

        # Authenticate as Owner.
        self.client.force_authenticate(user=self.owner)

        # Try assigning the new staff member.
        response = self.client.post(
            f"{self.production_url}{self.production.id}/members/",
            {
                "user": new_staff.id,
                "role": "STAFF"
            },
            format="json"
        )

        # Archived production must reject new assignments.
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        # Verify that no membership was created.
        self.assertFalse(
            ProductionMembership.objects.filter(
                production=self.production,
                user=new_staff
            ).exists()
        )

    # --------------------------------------------------------
    # INVALID PRODUCTION ID
    # --------------------------------------------------------

    def test_invalid_production_id_returns_404(self):

        self.client.force_authenticate(user=self.owner)

        invalid_id = 999999

        response = self.client.post(
            f"{self.production_url}{invalid_id}/archive/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )


    # --------------------------------------------------------
    # ACCOUNTANT AND MEMBER CREATION RESTRICTIONS
    # --------------------------------------------------------

    def test_accountant_cannot_create_production(self):
        self.client.force_authenticate(user=self.accountant)

        response = self.client.post(
            self.production_url,
            {
                "name": "Accountant Film",
                "code": "EDGE-ACCOUNTANT",
                "start_date": "2026-04-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_create_production(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            self.production_url,
            {
                "name": "Member Film",
                "code": "EDGE-MEMBER",
                "start_date": "2026-04-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --------------------------------------------------------
    # CROSS-ORGANIZATION UPDATE AND ARCHIVE ISOLATION
    # --------------------------------------------------------

    def test_owner_cannot_update_another_organizations_production(self):
        another_organization = Organization.objects.create(
            name="Another Organization",
        )

        another_production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-001",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.patch(
            f"{self.production_url}{another_production.id}/",
            {"name": "Unauthorized Update"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        another_production.refresh_from_db()
        self.assertEqual(another_production.name, "Other Film")

    def test_owner_cannot_archive_another_organizations_production(self):
        another_organization = Organization.objects.create(
            name="Another Organization",
        )

        another_production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-002",
            start_date="2026-01-01",
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{another_production.id}/archive/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        another_production.refresh_from_db()
        self.assertEqual(
            another_production.status,
            Production.Status.PLANNED,
        )

    def test_owner_cannot_restore_another_organizations_production(self):
        another_organization = Organization.objects.create(
            name="Another Organization",
        )

        another_production = Production.objects.create(
            organization=another_organization,
            name="Other Film",
            code="OTHER-003",
            start_date="2026-01-01",
            status=Production.Status.ARCHIVED,
        )

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"{self.production_url}{another_production.id}/restore/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        another_production.refresh_from_db()
        self.assertEqual(
            another_production.status,
            Production.Status.ARCHIVED,
        )

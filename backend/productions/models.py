from django.db import models
from accounts.models import Organization


class Production(models.Model):

    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    organization = models.ForeignKey(Organization,on_delete=models.PROTECT,related_name="productions")
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    status = models.CharField(max_length=20,choices=Status.choices,default=Status.PLANNED,)
    start_date = models.DateField()
    end_date = models.DateField(null=True,blank=True,)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                name="unique_production_code_per_organization",   #One organization can have many productions, but each production code must be unique within that organization.
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.code})"




class ProductionMembership(models.Model):

    class Role(models.TextChoices):
        DIRECTOR = "DIRECTOR", "Director"
        PRODUCTION_MANAGER = "PRODUCTION_MANAGER", "Production Manager"
        STAFF = "STAFF", "Staff"

    user = models.ForeignKey("accounts.User",on_delete=models.CASCADE,related_name="production_memberships",)
    production = models.ForeignKey(Production,on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=30,choices=Role.choices,)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["production", "user"],
                name="unique_user_per_production",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.production.name} ({self.role})"
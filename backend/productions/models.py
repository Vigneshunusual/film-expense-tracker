from django.db import models
from accounts.models import Organization


class Production(models.Model):   #This creates a Django model named Production. Django uses it to manage a corresponding database table.
    class Status(models.TextChoices):
        PLANNED = "PLANNED", "Planned"   #First value: what Django stores in the database. Second value: the human-readable label.
        ACTIVE = "ACTIVE", "Active"   #The database stores "ACTIVE", while Django can display "Active" to the user.
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"

    organization = models.ForeignKey(Organization,on_delete=models.PROTECT,related_name="productions")  #It creates a relationship where one organization can have many productions, but each production belongs to one organization.
    name = models.CharField(max_length=255)  #prod name
    code = models.CharField(max_length=50)  #prod code
    status = models.CharField(max_length=20,choices=Status.choices,default=Status.PLANNED,)
    start_date = models.DateField()
    end_date = models.DateField(null=True,blank=True,)
    created_at = models.DateTimeField(auto_now_add=True)   #Automatically records when the production record is first created.
    updated_at = models.DateTimeField(auto_now=True)  #Automatically updates the timestamp when the model instance is saved.
  
    class Meta:
        constraints = [
            models.UniqueConstraint(  #The combination of organization and production code must be unique.
                fields=["organization", "code"],  
                name="unique_production_code_per_organization",   #One organization can have many productions, but each production code must be unique within that organization.
            )
        ]
        ordering = ["-created_at"]   #default ordering:Django orders production records by creation time, newest first. (-)means desc order.
        # For example:
        #     1. Film XYZ — created most recently.
        #     2. Film ABC — created earlier.
        #     3. Film PQR — created first.

    def __str__(self):
        return f"{self.name} ({self.code})"  #Django displays a production as text.  : Film ABC (ABC001)



#This model records which user is assigned to which production and what their production-specific role is.
class ProductionMembership(models.Model):

    class Role(models.TextChoices):
        DIRECTOR = "DIRECTOR", "Director"
        PRODUCTION_MANAGER = "PRODUCTION_MANAGER", "Production Manager"
        STAFF = "STAFF", "Staff"

    user = models.ForeignKey("accounts.User",on_delete=models.CASCADE,related_name="production_memberships",)
                                #acc.user=>It is a string reference to the model. Django can resolve it without requiring a direct import of the User model in this file.
    production = models.ForeignKey(Production,on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=30,choices=Role.choices,)
        # User: Arun
        # Production: Film ABC
        # Role: DIRECTOR
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(   #This means the same user cannot have two separate membership records for the same production.
                fields=["production", "user"],
                name="unique_user_per_production",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.production.name} ({self.role})"  #Displays the assignment in readable form.
                    #arun@example.com - Film ABC (DIRECTOR)
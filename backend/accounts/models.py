from django.contrib.auth.models import AbstractUser
from django.db import models

#1. Why do we need a Custom User?
#Django provides a default User, but for a commercial SaaS it is better to create our own user model from the beginning.

#We're extending Django's existing authentication system: uisng AbstractUser: So we don't have to manually rebuild password hashing, permissions, is_active, is_staff, etc.
class User(AbstractUser):
    email = models.EmailField(unique=True)    #saran

    def __str__(self):
        return self.email


class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)   #OGC
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class OrganizationMembership(models.Model):
    class Role(models.TextChoices):  #TextChoices = a clean Django way to define predefined text choices for a model field.
        #'OWNER'  → actual value stored in database
        #'Owner'  → human-readable label
        OWNER = 'OWNER', 'Owner'     #owner
        MANAGER = 'MANAGER', 'Manager'
        ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
        MEMBER = 'MEMBER', 'Member'

    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name='organization_memberships')
    organization = models.ForeignKey(Organization,on_delete=models.CASCADE,related_name='memberships')
    role = models.CharField(max_length=20,choices=Role.choices,default=Role.MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(       # Constraints says: The combination of user + organization must be unique.
                fields=['user', 'organization'],  #the same user cannot be added to the same organization more than once.
                name='unique_user_organization'
            )
        ]

    def __str__(self):
        return f'{self.user.email} - {self.organization.name} - {self.role}'


#user -->organisation Membership-> organisation --> :owner or member or admin 




import uuid
class OrganizationInvitation(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        EXPIRED = 'EXPIRED', 'Expired'
        CANCELLED = 'CANCELLED', 'Cancelled'

    organization = models.ForeignKey(Organization,on_delete=models.CASCADE,related_name='invitations')   #Which organization is inviting the person.   OGC Films=> Invitation to  → arun@gmail.com
    email = models.EmailField()
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150,blank=True)
    token = models.UUIDField(default=uuid.uuid4,unique=True,editable=False)  #This is the unique invitation identifier.
    role = models.CharField(max_length=20,choices=OrganizationMembership.Role.choices,default=OrganizationMembership.Role.MEMBER)   #When Nishok invites someone, he can specify their organization role.
    status = models.CharField(max_length=20,choices=Status.choices,default=Status.PENDING)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True,blank=True)

    def __str__(self):
        return f'{self.email} - {self.organization.name} - {self.status}'
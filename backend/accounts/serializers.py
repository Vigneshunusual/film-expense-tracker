#The serializer handles data coming from the API.

#Gets our active custom User model.
from django.contrib.auth import get_user_model

#Django's built-in password validation.
from django.contrib.auth.password_validation import validate_password

#Allows us to make multiple database operations behave as one transaction.
from django.db import transaction

#imports DRF serializers.
from rest_framework import serializers

#Imports our two models.
from .models import Organization, OrganizationMembership

#Stores our custom User model in User.
User = get_user_model()

#for registration:
class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,   #password can be sent to the API but won't be returned.
        validators=[validate_password])   #checks Django's password rules.
    organization_name = serializers.CharField(max_length=255)

    def validate_email(self, value): # EMail Valiadtion
        if User.objects.filter(email=value).exists():  #Checks whether this email already exists.
            raise serializers.ValidationError(   #If it exists, registration fails with an error.
                "A user with this email already exists."
            )

        return value  # If it doesn't exist, continue.

    @transaction.atomic  #Create user + organization    # transaction atomic means, either everything succeeds, or Django rolls the whole operation back.
    #Makes all operations below one transaction.
        #If something fails:
            #User created       ❌
            #Organization       ❌
            #Membership         ❌
        #Django rolls everything back.

        #If everything succeeds: User  ✅ Organization ✅  Membership ✅

    def create(self, validated_data):  # Runs when the serializer creates the registration data.
        first_name = validated_data.pop("first_name")   #Gets first name and removes it from validated_data. and same fore below too 
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        organization_name = validated_data.pop("organization_name")

        #Now we have the four values separately.
        user = User.objects.create_user(      #because create_user() properly hashes the password.
            #Uses email as the username. annd Stores the username .
            username=email,
            #Uses email as the email.  and Stores the email.
            email=email,
            #Uses first_name as the first_name.
            first_name=first_name,
            #Uses password as the password.
            password=password
        )

        #Creates the organization entered during registration.
        organization = Organization.objects.create(name=organization_name)


        #Create Membership
            #Creates the relationship between User and Organization.
        OrganizationMembership.objects.create(

            #This user belongs to the membership.
            user=user,

            #This organization belongs to the membership.
            organization=organization,

            #The user becomes the Owner of the newly created organization.
            role=OrganizationMembership.Role.OWNER
        )

        return user

#Register → Validate email/password → Create User → Create Organization → Create Membership → Register User = OWNER



#for login:
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):   #attrs contains the data submitted by the frontend.
           #attrs = {"email": "vignesh@gmail.com","password": "mypassword"}
        email = attrs.get("email")
        password = attrs.get("password")

        user = User.objects.filter(email=email).first()  
            #Searches the database for a user with that email.
                    #.first() returns:
                    #- User object → if found
                    #- None → if not found

        if user is None or not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user   #adds a new key called user:
                    #attrs = {"email": "vignesh@gmail.com","password": "mypassword","user": <User object>}

        return attrs



#OrganizationMembership
class CurrentOrganizationSerializer(serializers.ModelSerializer):
    organization_id = serializers.IntegerField(
        source='organization.id',
        read_only=True
    )

    organization_name = serializers.CharField(
        source='organization.name',
        read_only=True
    )

    class Meta:
        model = OrganizationMembership
        fields = [
            'organization_id',
            'organization_name',
            'role',
        ]
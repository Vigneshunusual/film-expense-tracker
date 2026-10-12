#In Django REST Framework (DRF), a serializer acts as a bridge between your database models and API data.
#For example, the frontend sends this JSON when the Owner creates a production:
        #The serializer validates this data and helps convert it into the format Django needs to create a Production object.
        #The reverse also happens: when the backend returns a production to React, the serializer converts the model object into JSON.


from rest_framework import serializers

from .models import Production,ProductionMembership
from accounts.models import OrganizationMembership

        #class ProductionSerializer defines our serializer. 
class ProductionSerializer(serializers.ModelSerializer):  #serializers.ModelSerializer is a DRF class that automatically builds serializer fields based on a Django model.

    class Meta:  #This tells DRF which model the serializer works with.
        model = Production 
        #This specifies which fields the API can accept or return through this serializer.
        fields = ["id","name","code","status","start_date","end_date","created_at","updated_at",]
        read_only_fields = ["id","created_at","updated_at",]

   #Runs custom validation for the whole serializer.
                #attrs is a dictionary containing the incoming fields after DRF has performed its basic field validation and conversion.
    def validate(self, attrs):   #attrs is a dictionary containing the validated input data sent by the frontend.
                                 #attrs["start_date"] => Give me the start date that was submitted.
                                 #attrs["end_date"]=> Give me the endt date that was submitted.

        #   # attrs is look like : {
        #                             "name": "Film ABC",
        #                             "code": "ABC001",
        #                             "start_date": date(2026, 10, 10),
        #                             "end_date": date(2027, 5, 10)
        #                         }
         
        #instead of deleteing production, we use archieve. because, we need finance in future. 
        # Archived productions are read-only.  (once its acrchieved: we cant edit name, start_date, end date etc)
             #for POST /api/productions/ => self.instance is none
             #for PATCH /api/productions/1/ => self.istance is a exisitng prouctioon object
             #here, self.insatnce meamns, Is there an existing Production? if yes , check status. if none => conditoon false.
        if self.instance and self.instance.status == "ARCHIVED":   #If we're updating an existing Production, check its status.
            raise serializers.ValidationError("Archived productions cannot be modified.")  #if both condtion true (staus is archieved)=> raise am error.

                        #there are twwo fucnt: attr.get(startdate) and getatrr(sef=lf,attribute,none)
        start_date = attrs.get("start_date",getattr(self.instance, "start_date", None))   #attrs.get("start_date", default_value)
                        #Look for "start_date" inside attrs.
                        #If it exists, give me its value. -> attrs.get('start_date')
                        #If it doesn't exist, use the default value. ->default value
                            #getattr() is a Python built-in function used to get an attribute from an object.
                                  #syntax: getattr(object, "attribute", default) which means Get this attribute from this object. If it doesn't exist, return the default value.
                            #self.instance  represents that existing Film ABC object.  => getattr(self.instance,"start_date")
                            #for none: Try to get start_date from self.instance. If it isn't available, return None.


        end_date = attrs.get("end_date",getattr(self.instance, "end_date", None))

        if end_date and start_date and end_date < start_date:   #If both dates exist, is the end date before the start date?
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        return attrs



class ProductionMembershipSerializer(serializers.ModelSerializer):
#This serializer handles the data associated with assigning a user to a production.

    class Meta:
        model = ProductionMembership
        fields = [
            "id",
            "user",
            "production",
            "role",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "production",
            "created_at",
    
        ]

    def validate_user(self, user):

        production = self.context["production"]   #This retrieves the production

         # Check whether the selected user belongs to this organization.
        belongs_to_organization = OrganizationMembership.objects.filter(organization=production.organization,user=user,).exists()
        if not belongs_to_organization:
            raise serializers.ValidationError(
            "This user does not belong to this organization's membership.")
        return user

    
        # For example:
        #      OGC Productions owns the production Leo.
        #     - Saran is a member of OGC Productions.
        #     - The Owner tries to assign Ravi to Leo.
        #     - The validation checks whether Ravi belongs to OGC Productions before allowing the assignment.



    def validate(self, attrs):
        # Get the production and selected user.
        production = self.context["production"]
        user = attrs["user"] 

        # Check whether the user is already assigned to this production.
        already_assigned = ProductionMembership.objects.filter(
            production=production,
            user=user,
        ).exists()

        if already_assigned:
            raise serializers.ValidationError({
                "user": "This user is already assigned to this production."
            })

        return attrs
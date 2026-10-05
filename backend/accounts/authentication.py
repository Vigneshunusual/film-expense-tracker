#SimpleJWT doesn't automatically look inside our access_token cookie.
    #So we create CookieJWTAuthentication to tell Django:
        #"When a request comes in, check the normal JWT header first. If there isn't one, look in our cookie."




from rest_framework_simplejwt.authentication import JWTAuthentication

#for csrf checking, we need to import CSRFCheck and exceptions from rest_framework.
from rest_framework.authentication import CSRFCheck #tool for checking whether the request has a valid CSRF token.
from rest_framework import exceptions   #We need this to return a 403 Permission Denied when CSRF fails.

class CookieJWTAuthentication(JWTAuthentication):   #"Take Django's normal JWT authentication and modify it so it can also read the token from a cookie."
    #CookieJWTAuthentication inherits everything from JWTAuthentication.
    #So we get all the existing JWT functionality and only customize the part we need.

   
    def authenticate(self, request):  #who is making this request? (request = the incoming HTTP request)
        # First, check Authorization header
        header = self.get_header(request)  #SimpleJWT has a method called:get_header() that checks the Authorization header for a JWT. If it finds one, it returns it. If not, it returns None.

        if header is not None:   #"Did we find an Authorization header?"
            return super().authenticate(request)    #super() calls the parent class's authenticate() method. So if there is an Authorization header, we just use the normal JWT authentication process.

        # If no Authorization header,
        # get access token from HttpOnly cookie
        raw_token = request.COOKIES.get("access_token")     #If there is no header, get the JWT from our cookie."

        if raw_token is None:
            return None   #"If there is no access token in the cookie, this request is not authenticated."

        #This checks whether the JWT is valid.(like valid jwt, signature, not expired, etc.) If it is valid, it returns the validated token. If not, it raises an exception.
        validated_token = self.get_validated_token(raw_token)   


        # 4. CSRF protection: after validating the token, we check the CSRF token. This is important because even though the JWT is valid, we still need to ensure that the request is coming from a trusted source (the same site). This prevents cross-site request forgery attacks.
        self.enforce_csrf(request)  #checks the CSRF token. 

        # Get the user associated with the token
        return self.get_user(validated_token), validated_token 
              #self.get_user(validated_token)=> → Gets the Django user from the JWT.
              #validated_token => → returns the validated token itself.


    

    def enforce_csrf(self, request): #This is our own function that performs the CSRF check

        # CSRF is required only for unsafe requests
        if request.method in ["GET", "HEAD", "OPTIONS", "TRACE"]:
            return

        check = CSRFCheck(lambda request: None) #django csrf checker("a tool that knows how to verify CSRF.")

        check.process_request(request)

        reason = check.process_view(request,lambda request: None,(),{})  #"Is this request's CSRF token valid?" if it is valid, process_view() returns None. If not, it returns a string explaining why the CSRF check failed.


        if reason:
            raise exceptions.PermissionDenied(
                f"CSRF Failed: {reason}")
            
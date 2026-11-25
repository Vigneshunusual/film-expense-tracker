from django.apps import AppConfig


class ProductionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'  #Uses 64-bit auto-incrementing primary keys by default.
    name = 'productions'  #Identifies your Django application as productions.


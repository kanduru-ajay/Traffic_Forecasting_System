from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [("admin", "Admin"), ("user", "User")]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"

    def is_admin(self):
        return self.role == "admin"

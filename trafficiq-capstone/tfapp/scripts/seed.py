#!/usr/bin/env python
"""Seed script: creates admin + sample user."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.users.models import User

users = [
    {"username": "admin", "email": "admin@traffic.io", "password": "Admin@1234", "role": "admin", "is_staff": True, "is_superuser": True},
    {"username": "analyst", "email": "analyst@traffic.io", "password": "Analyst@1234", "role": "user"},
]

for u in users:
    if not User.objects.filter(username=u["username"]).exists():
        User.objects.create_user(**u)
        print(f"Created: {u['username']} ({u['role']})")
    else:
        print(f"Exists:  {u['username']}")

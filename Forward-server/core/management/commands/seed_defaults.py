import json
import datetime
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, Facility
from django.db import transaction

class Command(BaseCommand):
    help = 'Seed default users, groups, and other essential data into the database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'path', type=str, help='Relative path to the JSON file containing default data from the management command'
        )
        parser.add_argument(
            '--fullpath', action='store_true', help='Full path to the JSON file containing default data'
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing data (matching lesson title and non-superusers) before seeding'
        )
    
    def handle(self, *args, **options):
        file_path = options['path']
        basepath = Path(settings.BASE_DIR) / 'core' / 'management' / 'seed_data'
        path = basepath / file_path if not options["fullpath"] else options["path"] 
        
        try:
            with open(path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {path}'))
            return
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR(f'Invalid JSON in file: {path}'))
            return
        
        with transaction.atomic():
                if options['reset']:
                    self.delete_existing_defaults()
                facility_data = data.get('facilities', [])
                self.create_facilities(facility_data)
                
                user_data = data.get('users', [])
                self.create_users(user_data)
                
                    
    def delete_existing_defaults(self):
        """Deletes data related to the specific lesson title and non-superuser users."""
        
        # Delete non-superuser users (be careful with this in production)
        deleted_users, _ = User.objects.all().delete()
        deleted_facilities, _ = Facility.objects.all().delete()
        if deleted_facilities:
            self.stdout.write(f"Deleted {deleted_facilities} Facility objects.")
        if deleted_users:
            self.stdout.write(f"Deleted {deleted_users} non-superuser User objects.")

    def create_facilities(self, facility_data):
        """Creates or updates facilities from the provided data."""
        for data in facility_data:
            name = data.get('name')
            code = data.get('code')
            if not name or not code:
                self.stdout.write(self.style.WARNING("Skipping facility entry with missing name or code."))
                continue
            facility, created = Facility.objects.update_or_create(
                code=code,
                defaults={'name': name}
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} facility: {facility.name}")

    def create_users(self, user_data):
        """Creates or updates users from the provided data."""
        for data in user_data:
            username = data.get('username')
            if not username:
                self.stdout.write(self.style.WARNING("Skipping user entry with no username."))
                continue
            password = data.get('password', 'password') # Default password if not provided
            # Hash the password if it's plain text
            if not password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2$')):
                password = make_password(password)
                
            facility = Facility.objects.filter(code__iexact=data.get('facility')).first() if data.get('facility') else None
                        
            defaults = {
                'password': password,
                'display_name': data.get('display_name', username),
                'consent': data.get('consent', False),
                'profile_picture': data.get('profile_picture'),
                'theme': data.get('theme', 'light'),
                'text_size': data.get('text_size', 'txt-base'),
                'speech_uri_index': data.get('speech_uri_index'),
                'speech_speed': data.get('speech_speed'),
                'is_staff': data.get('is_staff', False),
                'is_superuser': data.get('is_superuser', False),
                'email': data.get('email'),
                'facility': facility,
                'surveyed_at': datetime.datetime.fromisoformat(data.get('surveyed_at')).date()\
                        if not (data.get('surveyed_at') == None) else None
            }
            
            # Remove None values from defaults to avoid overriding existing DB defaults unnecessarily
            defaults = {k: v for k, v in defaults.items() if v is not None}
            user, created = User.objects.update_or_create(
                username=username,
                defaults=defaults
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} user: {user.username}")

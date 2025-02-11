from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator


# Custom User model that extends Django's AbstractUser
# This gives us all the default user functionality (username, password, groups, permissions)
# while allowing us to add our own custom fields and methods
class User(AbstractUser):
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    # By default, Django requires email for user creation
    # We override this to make email optional since we're using username-based auth
    REQUIRED_FIELDS = []
    email = models.EmailField(
        'email address',
        blank=True,
        null=True
    )

    # User's first name - minimum 2 characters required
    first_name = models.CharField(
        'first name',
        max_length=50,
        validators=[MinLengthValidator(2)]
    )

    # User's last name - minimum 2 characters required
    last_name = models.CharField(
        'last name',
        max_length=50,
        validators=[MinLengthValidator(2)]
    )

    # Optional date of birth field
    # Both null and blank are True to make it optional
    date_of_birth = models.DateField(
        'date of birth',
        null=True,
        blank=True
    )

    # Automatically set when the user is created and updated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_full_name(self):
        """
        Return the user's full name
        """
        full_name = f'{self.first_name} {self.last_name}'
        return full_name.strip()
    
    def get_age(self):
        """
        Calculate age from date of birth
        """
        if not self.date_of_birth:
            return None
        
        from datetime import date
        today = date.today()

        # accounts for birth dates that haven't occurred yet this year
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    def __str__(self):
        """
        String representation of the user - returns username
        Used in Django admin and whenever a user object is printed
        """
        return self.username
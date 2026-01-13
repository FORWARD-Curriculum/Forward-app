# Generated manually to merge conflicting migrations
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_alter_slide_content'),
        ('core', '0002_remove_pollquestionresponse_associated_activity_and_more'),
    ]

    operations = [
        # This can be empty; Django just uses it to know the order

    ]

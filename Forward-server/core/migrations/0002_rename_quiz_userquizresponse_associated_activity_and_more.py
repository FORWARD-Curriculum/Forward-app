# Generated by Django 5.2 on 2025-04-25 00:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userquizresponse',
            old_name='quiz',
            new_name='associated_activity',
        ),
        migrations.RenameField(
            model_name='userquizresponse',
            old_name='is_complete',
            new_name='partial_response',
        ),
        migrations.AlterUniqueTogether(
            name='userquizresponse',
            unique_together={('user', 'associated_activity')},
        ),
    ]

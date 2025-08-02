from django.core.management.base import BaseCommand
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from botocore.exceptions import ClientError
import boto3

class Command(BaseCommand):


    
    def handle(self, *args, **options):

        try:
            files = default_storage.listdir('')
            print("Bucket exists and accessible!")
        except ClientError:
            self.stdout.write(self.style.ERROR('No bucket found.'))
            self.stdout.write(self.style.ERROR('Creating bucket'))

            # Creates client and creates bucket
            s3_client = boto3.client(
                's3',
                endpoint_url='http://minio:9000',  
                aws_access_key_id='minioadmin',   
                aws_secret_access_key='minioadmin'  
            )

            bucket_name = settings.STORAGES['default']['OPTIONS']['bucket_name']  # or get it from your settings
            s3_client.create_bucket(Bucket=bucket_name)

            self.stdout.write(self.style.SUCCESS(f'Bucket Created: {bucket_name}'))

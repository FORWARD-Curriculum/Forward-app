from django.core.management.base import BaseCommand
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage
from botocore.exceptions import ClientError # pyright: ignore[reportMissingImports]
import boto3 # pyright: ignore[reportMissingImports]

class Command(BaseCommand):
    
    def upload_files_to_bucket(self, seed_minIO_folder):
        for file_path in seed_minIO_folder.iterdir():
            filename = Path(file_path).name
            with open(file_path, 'rb') as f:
                saved_path = default_storage.save(f'{filename}', f)
                # might need this
                url = default_storage.url(saved_path)
                self.stdout.write(self.style.SUCCESS(f'Image uploaded, url: {url}'))
   
    def handle(self, *args, **options):
        seed_minIO_folder = Path(settings.BASE_DIR) / 'core' / 'management' / 'minIO_asset_seed'
        try:
            files = default_storage.listdir('')
            bucket_file_count = len(files)
            
            """
                This is temporary. If a new media was added and the
                amount dosent match with those in minio volume
                its overwritten with new contents.
                Maybe we can make it just add the new ones in the future?
            """
            local_files = list(seed_minIO_folder.iterdir())
            local_file_count = len([f for f in local_files if f.is_file()])
            if bucket_file_count == local_file_count:
                self.stdout.write(self.style.SUCCESS('Bucket exists'))
                return
            else:
                self.upload_files_to_bucket(seed_minIO_folder)
                
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

            bucket_name = settings.STORAGES['default']['OPTIONS']['bucket_name']
            s3_client.create_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f'Bucket Created: {bucket_name}'))
            
            # One time seed to minio volume of existing image files
            self.upload_files_to_bucket(seed_minIO_folder)
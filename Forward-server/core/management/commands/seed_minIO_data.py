from django.core.management.base import BaseCommand
from pathlib import Path
from django.conf import settings
from django.core.files.storage import storages
from botocore.exceptions import ClientError

class Command(BaseCommand):


    
    def handle(self, *args, **options):

        storage = storages['default']
        s3_client = storage.connection

        seed_minIO_folder = Path(settings.BASE_DIR) / 'Forward-server' / 'core' / 'management' / 'minIO_asset_seed'

        bucket_name ="media-bucket"

        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print("bucket there")
        except ClientError:
            print("bucket not there")

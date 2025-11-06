from django.core.files.storage import default_storage
import boto3
from pathlib import Path
from django.conf import settings
from typing import IO, Any
import uuid
from django.urls import reverse
import json

def s3_file_upload(file: IO[Any], s3_path="") -> str:
    """
        Uploads the blob file to the default s3 storage with the given key.
        Returns the path/key to query the bucket.
    """
    try:
        if not default_storage.exists(s3_path):
            default_storage.save(s3_path, file)
        return default_storage.url(s3_path)
    except:
        if settings.DEBUG:
            print('Development mode: Creating MinIO bucket')
            s3_client = boto3.client(
                's3',
                endpoint_url='http://minio:9000',   # upload endpoint
                aws_access_key_id='minioadmin',   # maybe need to change these to os.getenv
                aws_secret_access_key='minioadmin'  
            )
            bucket_name = settings.STORAGES['default']['OPTIONS']['bucket_name']
            try:
                s3_client.create_bucket(Bucket=bucket_name)
            except s3_client.exceptions.BucketAlreadyOwnedByYou:
                print(f'Bucket "{bucket_name}" already exists. Continuing.')
            except Exception as e:
                print(f'Failed to create or configure bucket: {e}')
                raise

def s3_file_delete(s3_path):
    try:
        default_storage.delete(s3_path)
    except:
        raise
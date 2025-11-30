from django.core.files.storage import default_storage
import boto3
from pathlib import Path
from django.conf import settings
from typing import IO, Any
import uuid
from django.urls import reverse
import json

from imagefield.fields import ImageFieldFile

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

DEFAULT_IMAGE_FORMATS = {
    "mobile":  ("default", ("thumbnail", (480,  480))),
    "tablet":  ("default", ("thumbnail", (800,  800))),
    "desktop": ("default", ("thumbnail", (1500, 1500))),
} if settings.OPTIMIZE_MEDIA else {}



class FwdImage():
    _formats: dict[str, tuple[str, tuple[str, tuple[int, int]]]] = {}
    def __init__(self, formats: dict[str, tuple[str, tuple[str, tuple[int, int]]]] = None):
        base = formats if formats is not None else DEFAULT_IMAGE_FORMATS
        if settings.OPTIMIZE_MEDIA:
            self._formats = {
                "internal_default_thumbnail": ("default", ("thumbnail", (240, 240))),
                **base,
            }
    
    @property
    def formats(self):
        return {key: list(value) for key, value in self._formats.items()}
    
    def stringify(self, image: ImageFieldFile) -> dict[str, str | dict[str, int]]:
        if image is None or not isinstance(image, ImageFieldFile):
            raise TypeError("Passed image was not an ImageFieldFile")
        
        optimized: dict[str, int] = {}
        for key, value in self._formats.items():
            optimized[getattr(image, key)] = value[1][1][0]
            
        return {
            "thumbnail": image.internal_default_thumbnail if image.internal_default_thumbnail else image.url,
            "original": image.url,
            "optimized": optimized
        }
import os
import uuid
from dotenv import load_dotenv
from app.core.config import settings
import boto3


s3 = boto3.client(
    "s3",
    aws_access_key_id     = settings.AWS_S3_ACCESS,
    aws_secret_access_key = settings.AWS_S3_DEV,
    region_name           = "us-east-2",
)

BUCKET = "medpassunr"


def upload_fileobj(file_obj, key: str) -> str:
    """
    Uploads a file‐like object to S3 under `key`.
    Returns the public URL (or S3 URI) for storage in your DB.
    """
    s3.upload_fileobj(file_obj, BUCKET, key)
    return f"s3://{BUCKET}/{key}"


def generate_s3_key(user_id: int, filename: str) -> str:
    """
    Generates a unique key, e.g. notes/{user_id}/{uuid4}.{ext}
    """
    ext = filename.split(".")[-1]
    return f"notes/{user_id}/{uuid.uuid4()}.{ext}"
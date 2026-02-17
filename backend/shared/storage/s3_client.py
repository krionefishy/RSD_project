"""
Базовый S3-клиент (boto3, path-style). Подходит для S3-совместимых бэкендов (MinIO, cloud.ru и т.п.).
Создаётся при старте сервиса, который работает с S3 или подписан на StorageTopics.
"""
import logging
import mimetypes
import unicodedata
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class S3ClientBase:
    def __init__(
        self,
        endpoint_url: str,
        tenant_id: str,
        key_id: str,
        secret_key: str,
        bucket_name: str,
        region: str = "ru-central-1",
        verify: bool = True,
    ):
        access_key = f"{tenant_id}:{key_id}" if tenant_id else key_id
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
            config=Config(
                s3={"addressing_style": "path"},
                signature_version="s3v4",
            ),
        )
        self.bucket_name = bucket_name
        if verify:
            self._verify_connection()

    def _verify_connection(self, bucket_name: Optional[str] = None) -> None:
        target_bucket = bucket_name or self.bucket_name
        try:
            self.s3_client.head_bucket(Bucket=target_bucket)
            logger.info("Successfully connected to S3 bucket: %s", target_bucket)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                raise RuntimeError(f"Bucket {target_bucket} not found.") from e
            if error_code == "403":
                raise RuntimeError(f"Access denied to bucket {target_bucket}.") from e
            raise RuntimeError(f"S3 connection error: {e}") from e

    def _sanitize_key_segment(self, value: Optional[str], fallback: str) -> str:
        if not value:
            return fallback
        normalized = unicodedata.normalize("NFKD", value).strip()
        if not normalized:
            return fallback
        allowed_chars = {"_", "-", "."}
        cleaned = []
        for ch in normalized:
            if ch.isalnum() or ch in allowed_chars:
                cleaned.append(ch)
            elif ch.isspace():
                cleaned.append("_")
            else:
                cleaned.append("_")
        result = "".join(cleaned).strip("._-")
        return result if result else fallback

    def guess_content_type(self, filename: str) -> str:
        if not filename:
            return "application/octet-stream"
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or "application/octet-stream"

    def get_content_type(self, filename: str) -> str:
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        content_types = {
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls": "application/vnd.ms-excel",
            "csv": "text/csv",
            "pdf": "application/pdf",
            "txt": "text/plain",
            "json": "application/json",
        }
        return content_types.get(ext, "application/octet-stream")

    def put_object_raw(
        self,
        key: str,
        body: bytes,
        content_type: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        ct = content_type or "application/octet-stream"
        kwargs: dict = {
            "Bucket": self.bucket_name,
            "Key": key,
            "Body": body,
            "ContentType": ct,
        }
        if metadata:
            kwargs["Metadata"] = {k: str(v) for k, v in metadata.items()}
        self.s3_client.put_object(**kwargs)
        logger.info("S3 put_object_raw: %s", key)

    def get_object(self, key: str) -> bytes:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise FileNotFoundError(f"S3 object not found: {key}") from e
            raise RuntimeError(f"S3 get_object error: {e}") from e

    def head_object(self, key: str) -> dict:
        try:
            return self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise FileNotFoundError(f"S3 object not found: {key}") from e
            raise RuntimeError(f"S3 head_object error: {e}") from e

    def delete_object(self, key: str) -> None:
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
        logger.info("S3 delete_object: %s", key)

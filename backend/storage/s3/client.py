import asyncio
import logging
import mimetypes
import unicodedata
from typing import Optional

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class S3Client:

    def __init__(
        self,
        endpoint_url: str,
        key_id: str,
        secret_key: str,
        bucket_name: str,
        tenant_id: str = "",
        region: str = "ru-central-1",
        verify: bool = True,
    ):
        access_key = f"{tenant_id}:{key_id}" if tenant_id else key_id
        self._client = boto3.client(
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

    def _verify_connection(self) -> None:
        try:
            self._client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 connected: bucket %s", self.bucket_name)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                raise RuntimeError(f"Bucket {self.bucket_name} not found") from e
            if error_code == "403":
                raise RuntimeError(f"Access denied to bucket {self.bucket_name}") from e
            raise RuntimeError(f"S3 connection error: {e}") from e

    def sanitize_key_segment(self, value: Optional[str], fallback: str) -> str:
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
            else:
                cleaned.append("_")
        result = "".join(cleaned).strip("._-")
        return result if result else fallback

    def guess_content_type(self, filename: str) -> str:
        if not filename:
            return "application/octet-stream"
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or "application/octet-stream"

    async def put_object(
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
        await asyncio.to_thread(self._client.put_object, **kwargs)
        logger.info("S3 put_object: %s", key)

    async def get_object(self, key: str) -> bytes:
        try:
            response = await asyncio.to_thread(
                self._client.get_object, Bucket=self.bucket_name, Key=key
            )
            return response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise FileNotFoundError(f"S3 object not found: {key}") from e
            raise RuntimeError(f"S3 get_object error: {e}") from e

    async def delete_object(self, key: str) -> None:
        await asyncio.to_thread(
            self._client.delete_object, Bucket=self.bucket_name, Key=key
        )
        logger.info("S3 delete_object: %s", key)

    async def delete_objects(self, keys: list[str]) -> None:
        if not keys:
            return
        objects = [{"Key": k} for k in keys]
        await asyncio.to_thread(
            self._client.delete_objects,
            Bucket=self.bucket_name,
            Delete={"Objects": objects},
        )
        logger.info("S3 delete_objects: %d items", len(keys))

    async def head_object(self, key: str) -> dict:
        try:
            return await asyncio.to_thread(
                self._client.head_object, Bucket=self.bucket_name, Key=key
            )
        except ClientError as e:
            if e.response["Error"]["Code"] in ("NoSuchKey", "404"):
                raise FileNotFoundError(f"S3 object not found: {key}") from e
            raise RuntimeError(f"S3 head_object error: {e}") from e

    async def list_objects(self, prefix: str = "") -> list:
        response = await asyncio.to_thread(
            self._client.list_objects_v2, Bucket=self.bucket_name, Prefix=prefix
        )
        return response.get("Contents", [])

    def generate_presigned_url(
        self,
        key: str,
        expiration: int = 3600,
        response_content_type: Optional[str] = None,
        response_disposition: Optional[str] = None,
    ) -> str:
        params: dict = {"Bucket": self.bucket_name, "Key": key}
        if response_content_type:
            params["ResponseContentType"] = response_content_type
        if response_disposition:
            params["ResponseContentDisposition"] = response_disposition
        return self._client.generate_presigned_url(
            "get_object", Params=params, ExpiresIn=expiration
        )

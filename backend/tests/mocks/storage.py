from __future__ import annotations

from typing import Any
from uuid import uuid4


class MockS3Client:
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.operations: list[dict[str, Any]] = []
        self._uploads: dict[str, bytes] = {}
        self._endpoint_url = kwargs.get("endpoint_url", "https://test-s3.example.com")
        self._bucket = kwargs.get("bucket", "test-bucket")

    @staticmethod
    def sanitize_key_segment(value: str | None, fallback: str) -> str:
        if not value:
            return fallback
        cleaned = "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in value)
        return cleaned or fallback

    async def put_object(
        self,
        key: str,
        body: bytes,
        content_type: str = "application/octet-stream",
        metadata: dict[str, str] | None = None,
    ) -> None:
        self.operations.append({
            "operation": "put_object",
            "key": key,
            "content_type": content_type,
            "size": len(body),
            "metadata": metadata or {},
        })
        self._uploads[key] = body

    async def upload_file(
        self,
        file_data: bytes,
        key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self.operations.append({
            "operation": "upload",
            "key": key,
            "content_type": content_type,
            "size": len(file_data),
        })
        self._uploads[key] = file_data
        return f"{self._endpoint_url}/{self._bucket}/{key}"

    async def generate_presigned_url(
        self,
        key: str,
        operation: str = "get_object",
        expiration: int = 3600,
    ) -> str:
        self.operations.append({
            "operation": "presign",
            "key": key,
            "method": operation,
            "expiration": expiration,
        })
        token = str(uuid4())
        return f"{self._endpoint_url}/{self._bucket}/{key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test&X-Amz-Signature={token}"

    async def generate_presigned_post(
        self,
        key: str,
        content_type: str,
        max_size: int = 10 * 1024 * 1024,
        expiration: int = 3600,
    ) -> dict[str, Any]:
        self.operations.append({
            "operation": "presign_post",
            "key": key,
            "content_type": content_type,
            "max_size": max_size,
            "expiration": expiration,
        })
        return {
            "url": f"{self._endpoint_url}/{self._bucket}",
            "fields": {
                "key": key,
                "Content-Type": content_type,
                "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
                "X-Amz-Credential": "test",
                "X-Amz-Date": "20240101T000000Z",
                "X-Amz-Signature": str(uuid4()),
            },
        }

    async def delete_file(self, key: str) -> bool:
        self.operations.append({
            "operation": "delete",
            "key": key,
        })
        if key in self._uploads:
            del self._uploads[key]
            return True
        return False

    async def file_exists(self, key: str) -> bool:
        return key in self._uploads

    def get_uploaded_content(self, key: str) -> bytes | None:
        return self._uploads.get(key)

    def clear_operations(self) -> None:
        self.operations.clear()

    def get_operations_by_type(self, operation: str) -> list[dict[str, Any]]:
        return [op for op in self.operations if op.get("operation") == operation]

    def was_operation_performed(self, operation: str, key: str | None = None) -> bool:
        for op in self.operations:
            if op.get("operation") == operation:
                if key is None or op.get("key") == key:
                    return True
        return False

    def clear_all(self) -> None:
        self.clear_operations()
        self._uploads.clear()

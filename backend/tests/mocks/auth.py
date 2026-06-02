from __future__ import annotations

from typing import Any
from uuid import UUID


class MockPasswordService:
    def __init__(self) -> None:
        self._hashes: dict[str, str] = {}
        self._calls: list[dict[str, Any]] = []

    def hash(self, password: str) -> str:
        self._calls.append({"method": "hash", "password": password})
        hashed = f"hashed_{password}"
        self._hashes[hashed] = password
        return hashed

    def verify(self, password: str, hashed: str) -> bool:
        self._calls.append({"method": "verify", "password": password, "hashed": hashed})
        return self._hashes.get(hashed) == password

    def decrypt(self, encrypted: str) -> str:
        self._calls.append({"method": "decrypt", "encrypted": encrypted})
        return encrypted


class MockRefreshTokenStore:
    def __init__(self) -> None:
        self._tokens: dict[str, str] = {}
        self._deleted_users: list[UUID] = []

    async def save(self, user_id: UUID, jti: str) -> None:
        self._tokens[f"{user_id}:{jti}"] = "1"

    async def exists(self, user_id: UUID, jti: str) -> bool:
        return f"{user_id}:{jti}" in self._tokens

    async def delete(self, user_id: UUID, jti: str) -> None:
        self._tokens.pop(f"{user_id}:{jti}", None)

    async def delete_all_for_user(self, user_id: UUID) -> int:
        self._deleted_users.append(user_id)
        keys_to_delete = [k for k in self._tokens.keys() if k.startswith(f"{user_id}:")]
        for k in keys_to_delete:
            del self._tokens[k]
        return len(keys_to_delete)

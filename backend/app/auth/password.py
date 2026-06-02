import base64
import logging

import bcrypt
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

from app.auth.rsa_keys import RsaKeyProvider

logger = logging.getLogger("auth.password")


class DecryptError(Exception):
    pass


class PasswordService:
    def __init__(self, rsa_keys: RsaKeyProvider):
        self._rsa_keys = rsa_keys

    def decrypt(self, encrypted_password_base64: str) -> str:
        private_key: RSAPrivateKey = self._rsa_keys.get_private_key()
        try:
            ciphertext = base64.b64decode(encrypted_password_base64, validate=True)
        except (ValueError, base64.binascii.Error) as exc:
            raise DecryptError("Encrypted password is not valid base64") from exc

        try:
            plaintext = private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )
        except ValueError as exc:
            raise DecryptError("Failed to decrypt password with server RSA key") from exc

        try:
            return plaintext.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise DecryptError("Decrypted password is not valid UTF-8") from exc

    @staticmethod
    def hash(raw_password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(raw_password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify(raw_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(
                raw_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except ValueError:
            return False

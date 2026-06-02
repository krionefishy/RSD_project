import logging
from threading import Lock
from typing import Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey

from shared.settings.config import Settings

logger = logging.getLogger("auth.rsa")


class RsaKeyProvider:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._private_key: Optional[RSAPrivateKey] = None
        self._public_key_pem: Optional[str] = None
        self._lock = Lock()

    def _ensure_loaded(self) -> None:
        if self._private_key is not None:
            return
        with self._lock:
            if self._private_key is not None:
                return
            pem_source = self._settings.jwt.rsa_private_key_pem
            if pem_source:
                self._private_key = serialization.load_pem_private_key(
                    pem_source.encode("utf-8"),
                    password=None,
                )
                if not isinstance(self._private_key, RSAPrivateKey):
                    raise RuntimeError("AUTH_RSA_PRIVATE_KEY_PEM must be an RSA private key")
            else:
                logger.warning(
                    "AUTH_RSA_PRIVATE_KEY_PEM is not set; generating an ephemeral RSA-%d keypair. "
                    "Tokens encrypted with the public key will stop working on restart.",
                    self._settings.jwt.rsa_key_size,
                )
                self._private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=self._settings.jwt.rsa_key_size,
                )
            public_key: RSAPublicKey = self._private_key.public_key()
            self._public_key_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode("utf-8")

    def get_private_key(self) -> RSAPrivateKey:
        self._ensure_loaded()
        assert self._private_key is not None
        return self._private_key

    def get_public_key_pem(self) -> str:
        self._ensure_loaded()
        assert self._public_key_pem is not None
        return self._public_key_pem

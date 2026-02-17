import base64


def decode_content(content_base64: str) -> bytes:
    return base64.b64decode(content_base64)

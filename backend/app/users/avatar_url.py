from storage.s3.client import S3Client


def resolve_avatar_url(s3_client: S3Client | None, avatar_url: str | None) -> str | None:
    if not avatar_url:
        return None
    if avatar_url.startswith(("http://", "https://", "data:", "blob:")):
        return avatar_url
    if s3_client is None:
        return None
    return s3_client.generate_presigned_url(avatar_url)

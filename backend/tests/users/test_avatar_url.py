from unittest.mock import MagicMock

from app.users.avatar_url import resolve_avatar_url


def test_resolve_avatar_url_returns_http_urls_unchanged() -> None:
    url = "https://example.com/avatar.jpg"
    assert resolve_avatar_url(None, url) == url


def test_resolve_avatar_url_generates_presigned_url_for_s3_key() -> None:
    s3 = MagicMock()
    s3.generate_presigned_url.return_value = "https://s3.example.com/avatars/u1/photo.jpg?sig=abc"
    result = resolve_avatar_url(s3, "avatars/u1/photo.jpg")
    assert result == "https://s3.example.com/avatars/u1/photo.jpg?sig=abc"
    s3.generate_presigned_url.assert_called_once_with("avatars/u1/photo.jpg")


def test_resolve_avatar_url_returns_none_when_s3_is_not_configured() -> None:
    assert resolve_avatar_url(None, "avatars/u1/photo.jpg") is None

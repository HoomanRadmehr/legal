from django.conf import settings


def test_django_uses_test_settings() -> None:
    assert settings.ROOT_URLCONF == "config.urls"
    assert settings.DEBUG is False

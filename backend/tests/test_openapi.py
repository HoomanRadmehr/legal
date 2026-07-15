from __future__ import annotations

from pathlib import Path

from django.conf import settings
from drf_spectacular.generators import SchemaGenerator

from common.api.openapi import ACCEPT_LANGUAGE_HEADER, IDEMPOTENCY_KEY_HEADER, RETRY_AFTER_HEADER

PUBLIC_API_DOMAINS = {
    "accounts",
    "activity",
    "cases",
    "contracts",
    "dashboard",
    "deadlines",
    "documents",
    "notices",
    "notifications",
    "offboarding",
    "organizations",
    "tasks",
}


def test_public_domains_own_openapi_files() -> None:
    apps_dir = Path(settings.BASE_DIR) / "apps"

    missing = [
        domain
        for domain in sorted(PUBLIC_API_DOMAINS)
        if not (apps_dir / domain / "api" / "v1" / "openapi.py").exists()
    ]

    assert missing == []


def test_common_headers_document_language_idempotency_and_rate_limits() -> None:
    assert ACCEPT_LANGUAGE_HEADER.name == "Accept-Language"
    assert ACCEPT_LANGUAGE_HEADER.enum == ["en", "fa"]
    assert IDEMPOTENCY_KEY_HEADER.name == "Idempotency-Key"
    assert RETRY_AFTER_HEADER.name == "Retry-After"


def test_generated_schema_has_stable_operation_ids_and_synthetic_examples() -> None:
    schema = SchemaGenerator().get_schema(request=None, public=True)
    operations = schema_operations(schema=schema)

    assert operation_ids(operations=operations)
    assert all(operation["operationId"] for operation in operations)
    assert "offboarding_execute" in operation_ids(operations=operations)
    assert "documents_presign" in operation_ids(operations=operations)
    assert "documents_complete" in operation_ids(operations=operations)
    assert schema_example_text(schema=schema).find("@gmail.com") == -1


def schema_operations(*, schema: dict) -> list[dict]:
    operations = []
    for path_item in schema["paths"].values():
        for method, operation in path_item.items():
            if method in {"get", "post", "put", "patch", "delete"}:
                operations.append(operation)
    return operations


def operation_ids(*, operations: list[dict]) -> set[str]:
    return {operation["operationId"] for operation in operations if operation.get("operationId")}


def schema_example_text(*, schema: dict) -> str:
    return str(schema.get("components", {})) + str(schema.get("paths", {}))

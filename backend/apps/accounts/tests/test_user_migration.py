"""Tests for the accounts initial migration."""

from __future__ import annotations

import pytest
from django.db import connection, migrations
from django.db.migrations.loader import MigrationLoader

pytestmark = pytest.mark.django_db


def test_accounts_initial_migration_creates_user_model() -> None:
    loader = MigrationLoader(connection)
    migration = loader.disk_migrations[("accounts", "0001_initial")]
    created_models = [
        operation.name
        for operation in migration.operations
        if isinstance(operation, migrations.CreateModel)
    ]

    assert created_models == ["User"]


def test_accounts_migration_has_single_initial_leaf() -> None:
    loader = MigrationLoader(connection)

    assert loader.graph.leaf_nodes("accounts") == [("accounts", "0001_initial")]

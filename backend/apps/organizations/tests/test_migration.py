"""Tests for the organizations initial migration."""

from __future__ import annotations

import pytest
from django.db import connection, migrations
from django.db.migrations.loader import MigrationLoader

pytestmark = pytest.mark.django_db


def test_organizations_initial_migration_creates_models() -> None:
    loader = MigrationLoader(connection)
    migration = loader.disk_migrations[("organizations", "0001_initial")]
    created_models = [
        operation.name
        for operation in migration.operations
        if isinstance(operation, migrations.CreateModel)
    ]

    assert created_models == ["Organization", "Membership"]


def test_organizations_migration_has_single_initial_leaf() -> None:
    loader = MigrationLoader(connection)

    assert loader.graph.leaf_nodes("organizations") == [("organizations", "0001_initial")]

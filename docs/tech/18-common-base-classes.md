# Common base class contract

The candidate wants project-owned framework classes so framework choices can be changed later.
These classes stay intentionally small. They standardize transport and primitive fields; they do not hide domain behavior.

## Model

```python
import uuid

from django.db import models


class CommonModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

Domain example:

```python
class Contract(CommonModel):
    matter = models.OneToOneField("matters.Matter", on_delete=models.PROTECT)
    contract_type = models.CharField(max_length=50)
    counterparty = models.CharField(max_length=255)
```

A domain model has one direct base. Organization, owner, version, and archive fields are explicit on models that need them.
The custom User is the documented exception: it inherits only `AbstractUser` and declares its UUID field explicitly.

## ModelSerializer

```python
from rest_framework import serializers


class CommonModelSerializer(serializers.ModelSerializer):
    class Meta:
        abstract = True
        read_only_fields = ("id", "created_at", "updated_at")
```

Domain serializers inherit only this base and list fields explicitly.
Do not add dynamic field inclusion, polymorphic dispatch, writable nested frameworks, or automatic service calls.

## ModelViewSet

```python
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.exceptions import MethodNotAllowed


class CommonModelViewSet(viewsets.ModelViewSet):
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    pagination_class = DefaultPagination

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE")
```

The real implementation may localize the error and use project exception helpers.
It must not implement organization permissions, audit, outbox, or domain writes.
A domain ViewSet inherits only `CommonModelViewSet` and explicitly calls selectors/services.

## Permission

```python
from rest_framework.permissions import BasePermission


class CommonPermission(BasePermission):
    message = _("You do not have permission to perform this action.")
```

Keep shared helpers small. A domain permission class inherits only `CommonPermission` and delegates to explicit permission functions.
Do not combine permission mixins or build a policy language.

## FilterSet

```python
from django_filters import rest_framework as django_filters


class CommonFilterSet(django_filters.FilterSet):
    pass
```

Domain FilterSets inherit only this base and list every field/filter explicitly.
Never use `fields = "__all__"`.

## WebSocket consumer

```python
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class CommonJsonConsumer(AsyncJsonWebsocketConsumer):
    # Only common ticket/origin/error-envelope helpers.
    pass
```

`UserEventsConsumer` inherits only this class.
The client cannot choose groups.

## Classes that must not exist

Do not create:

```text
CommonService
BaseService
BaseSelector
Repository
UnitOfWork
DomainModelMixin
AuditMixin
OrganizationMixin
VersionMixin
NotificationChannelBase
GenericCrudViewSet
DynamicSerializer
```

Services, selectors, audit, notifications, and version checks are plain named functions and explicit calls.

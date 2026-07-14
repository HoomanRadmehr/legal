# Service and selector example

This example demonstrates shape, not copy-paste implementation.

## Selector

```python
def contract_list(*, actor, organization):
    membership = get_active_membership(actor=actor, organization=organization)
    queryset = Contract.objects.select_related("matter", "matter__owner")
    return filter_contracts_for_membership(
        queryset=queryset,
        membership=membership,
    )
```

The permission filter must be explicit and tested. It may be a small function, not a manager hierarchy.

## Service

```python
@transaction.atomic
def contract_update(*, actor, contract, data, expected_version):
    require_contract_edit(actor=actor, contract=contract)
    require_version(current=contract.matter.version, expected=expected_version)
    validate_contract_dates(data=data, current=contract)

    apply_contract_fields(contract=contract, data=data)
    contract.save(update_fields=contract_update_fields(data))

    increment_matter_version(matter=contract.matter)
    record_activity(actor=actor, matter=contract.matter, action="contract.updated")
    create_outbox_event(matter=contract.matter, event_type="contract.updated")
    return contract
```

If this grows beyond the function limit, split validation, field application, audit, and outbox into clearly named functions. Do not create a service class.

## ViewSet write action

```python
def partial_update(self, request, *args, **kwargs):
    contract = self.get_object()
    serializer = ContractUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = contract_update(
        actor=request.user,
        contract=contract,
        data=serializer.validated_data,
        expected_version=serializer.validated_data["version"],
    )
    output = ContractDetailSerializer(updated, context=self.get_serializer_context())
    return Response(output.data)
```

The repetition is intentional and reviewable.

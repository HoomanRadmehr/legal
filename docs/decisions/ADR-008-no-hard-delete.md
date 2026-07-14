# ADR-008: Disable hard deletion of core legal records

- Status: Accepted
- Context: Legal information and activity history must remain auditable.
- Decision: The common ViewSet disables destroy by default. Matters use archive/close status; tasks and deadlines use cancellation; documents use revoke where required.
- Consequences: Queries must explicitly decide whether archived records are shown. Storage retention is documented separately and is not silently erased by a normal API delete.
- Rejected: Unrestricted `DELETE` on core records, implicit cascade deletion from normal user operations.

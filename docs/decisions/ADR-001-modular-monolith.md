# ADR-001: Use a modular monolith

- Status: Accepted
- Context: The assignment has a 1-2 day timebox and requires transactions, permissions, auditability, and tests.
- Decision: Use one Django modular monolith and one React frontend. Organize backend code by domain.
- Consequences: Strong local transactions and simpler setup. Domain boundaries remain visible, but independent deployment is deferred.
- Rejected: Microservices, Kubernetes, distributed sagas.

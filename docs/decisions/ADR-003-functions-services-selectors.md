# ADR-003: Plain function-based services and selectors

- Status: Accepted
- Context: The candidate requires standard, reviewable code and rejects complex class hierarchies.
- Decision: Reads use module-level selector functions. Writes use module-level service functions. ViewSets remain HTTP-focused; ModelSerializers validate transport data.
- Consequences: Control flow is explicit and testable. Some repeated ViewSet action code is acceptable.
- Rejected: Service classes, repositories, command buses, generic use-case frameworks.

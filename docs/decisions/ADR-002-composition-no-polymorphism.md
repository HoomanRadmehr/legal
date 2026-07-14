# ADR-002: Concrete Matter composition without polymorphism

- Status: Accepted
- Context: Cases, contracts, and notices share permissions, documents, tasks, deadlines, and audit linkage. The project prohibits polymorphic domain models and generic foreign keys.
- Decision: Use one concrete `Matter` table and explicit one-to-one `LegalCase`, `Contract`, and `LegalNotice` tables. Detail models do not inherit from Matter. Related work points to Matter.
- Consequences: Shared linkage stays simple; domain services create Matter plus detail atomically. Some explicit joins and validation are required.
- Rejected: Django multi-table inheritance, polymorphic packages, content-types, three nullable foreign keys on every related table.

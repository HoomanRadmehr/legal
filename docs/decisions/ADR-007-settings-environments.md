# ADR-007: Settings modules plus one environment key set

- Status: Accepted
- Context: Development and production need different security behavior, while infrastructure values should use a consistent env file shape.
- Decision: Use base, development, production, and test settings modules. Development hardcodes debug behavior; production hardcodes secure behavior. One `.env.example` documents deployment values.
- Consequences: Fewer unsafe boolean switches. Deployment must select the correct settings module and supply required values.
- Rejected: One giant settings file controlled entirely by booleans, committed environment files.

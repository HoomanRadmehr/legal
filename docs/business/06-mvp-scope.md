# MVP scope and prioritization

## P0: must work and be tested

- Django/React repository foundation, Docker development setup, health checks, and CI.
- JWT login, refresh rotation, logout, and role-aware organization membership.
- Permission-scoped list and retrieve APIs.
- Cases, contracts, and legal notices.
- Deadlines with upcoming, overdue, today, and assigned-to-me views.
- Tasks linked to matters.
- Private MinIO documents using presigned upload and download URLs.
- Upload-session state and realtime user events with polling fallback.
- Activity log for critical writes and document downloads.
- Dashboard summary respecting permissions.
- Ownership reassignment and admin offboarding preview/execute.
- In-app notifications and configurable email delivery.
- User preference rows for email, SMS, and push; SMS/push may use development stub providers if real credentials are unavailable.
- English/Persian UI, RTL, and Jalali input/display for relevant dates.
- OpenAPI generated and validated; each domain owns its schema declarations.
- Seed data, setup instructions, tests, and completed AI usage documentation.

## P1: implement only after P0 is stable

- Quiet hours and richer notification schedules.
- Organization document quotas.
- CSV export with asynchronous status.
- Detailed audit diff redaction policies.
- Fine-grained document-only access separate from matter read access.
- Production email/SMS/push provider integrations.

## Deferred

- Qdrant and semantic search.
- RAG or knowledge base.
- LangGraph.
- Temporal.
- Microservices and Kubernetes.
- OCR and document malware scanning implementation.
- Legal discussions/chat.
- Financial record module.
- Electronic signatures and approval workflow designers.

## Timebox rule

When time is limited, reduce screen polish and provider breadth before reducing authorization tests, deadline correctness, auditability, or setup clarity.

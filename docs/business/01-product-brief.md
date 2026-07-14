# Product brief

## Problem

Legal teams manage confidential cases, contracts, notices, deadlines, tasks, files, and ownership changes across disconnected tools.
A missed response or renewal deadline can have serious consequences, while excessive access can expose privileged or confidential information.

## Product objective

Provide one permission-aware workspace where authorized legal staff can:

- register and manage legal matters;
- see ownership and current status;
- find critical deadlines quickly;
- attach and download private documents safely;
- collaborate through assigned tasks;
- receive configurable reminders;
- understand who changed what and when; and
- transfer work safely when a team member leaves or changes role.

## Success conditions for the MVP

1. A user sees only records permitted by organization membership and matter access.
2. A manager can create and manage cases, contracts, and notices.
3. Deadline views correctly distinguish today, upcoming, and overdue items.
4. A document can be uploaded directly to MinIO without exposing storage credentials.
5. Upload and processing status can be observed in realtime and recovered by polling.
6. Critical writes produce audit records.
7. Ownership can be reassigned atomically.
8. The project starts through documented Docker commands and includes useful seed data and tests.

## Product qualities

In priority order:

1. Confidentiality and authorization correctness
2. Deadline correctness
3. Auditability
4. Data integrity
5. Reviewable code
6. Clear user experience
7. Operational reliability
8. Performance appropriate for an internal MVP

## Explicit non-goals

The MVP does not include:

- semantic search or RAG;
- LangGraph or an in-product AI assistant;
- Temporal;
- microservices or Kubernetes;
- OCR or malware scanning beyond a documented future hook;
- full discussions/chat;
- full legal finance/accounting;
- electronic signatures;
- complex approval workflow designers;
- document editing or version comparison;
- advanced analytics.

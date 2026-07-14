# Glossary

| Term | Meaning |
|---|---|
| Organization | The legal department's top-level security boundary. The MVP seeds one organization but preserves organization scoping. |
| Membership | A user's active relationship to an organization and assigned role. |
| Matter | Concrete shared record used for title, reference, owner, permissions, tasks, deadlines, documents, and audit linkage. |
| Legal Case | A matter representing litigation, dispute, investigation, claim, or similar legal work. |
| Contract | A matter representing an agreement with a counterparty. |
| Legal Notice | A matter representing an incoming formal notice that may require a response. |
| Owner | Primary person accountable for a matter. |
| Matter Access | An explicit user grant to view or edit a matter. |
| Deadline | A time-bound legal obligation linked to a matter. |
| Reminder | A configured notification scheduled before or at a deadline. |
| Task | Work assigned to a user and linked to a matter. |
| Upload Session | Short-lived server record controlling one direct upload to MinIO. |
| Document | Persisted metadata for a verified private object stored in MinIO. |
| Activity Log | Append-only record of a significant user or system action. |
| Outbox Event | Database record written in the same transaction as a business change and later dispatched asynchronously. |
| Offboarding Run | Previewed and executed transfer of a user's owned or assigned work. |
| Archive | A reversible or status-based removal from active workflows. It is not a hard delete. |
| Jalali date | Persian calendar representation used for display and input; canonical storage remains Gregorian/UTC. |

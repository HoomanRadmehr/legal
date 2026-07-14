Execute only <INT-TASK-ID>.
Read AGENTS.md, every applicable nested AGENTS.md, the integration task, all linked
backend/frontend specs, and relevant guardrails. Confirm every `Depends on` task is DONE
before editing; otherwise stop and report the unmet dependency.

Use the real local Compose services required by the task. Verify the published REST,
JWT/cookie/CSRF, WebSocket, MinIO, and error contracts as relevant. Cover happy paths and
negative security paths. Change only the task's Allowed scope. If the defect belongs to
backend or frontend product code outside that scope, document an exact reproducible finding,
identify the owning task/spec, set the integration task to BLOCKED, and do not silently patch it.

Run every verification command, `python3 scripts/check_simplicity.py`, and
`python3 scripts/validate_docs.py`. Update the task execution log and AI_USAGE.md.
Mark DONE only when every acceptance criterion passes, then stop.

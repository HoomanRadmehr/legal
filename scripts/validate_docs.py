#!/usr/bin/env python3
"""Validate the specification/task starter without external dependencies."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "AGENTS.md",
    "CODEX_START_HERE.md",
    "AI_USAGE.md",
    "docs/business/06-mvp-scope.md",
    "docs/guardrails/01-simplicity-and-reviewability.md",
    "docs/guardrails/02-security.md",
    "docs/tech/01-architecture.md",
    "docs/traceability/requirements.md",
    "specs/backend/BE-000-foundation.md",
    "specs/frontend/FE-000-foundation.md",
    "tasks/ORDER.md",
    "backend/AGENTS.md",
    "frontend/AGENTS.md",
]

ALLOWED_STATUS = {"TODO", "IN PROGRESS", "BLOCKED", "DONE"}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def heading_id(path: Path) -> str | None:
    first = path.read_text(encoding="utf-8").splitlines()[0]
    match = re.match(r"#\s+([A-Z]+-\d+):", first)
    return match.group(1) if match else None


def validate_markdown_links(errors: list[str]) -> None:
    pattern = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
    for path in ROOT.rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        for target in pattern.findall(text):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            clean = target.split("#", 1)[0]
            if not clean:
                continue
            resolved = (path.parent / clean).resolve()
            if not resolved.exists():
                fail(errors, f"Broken Markdown link in {path.relative_to(ROOT)}: {target}")


def main() -> int:
    errors: list[str] = []

    for rel in REQUIRED:
        if not (ROOT / rel).exists():
            fail(errors, f"Missing required file: {rel}")

    spec_paths = sorted((ROOT / "specs").glob("*/*.md"))
    task_paths = sorted((ROOT / "tasks").glob("*/*.md"))

    spec_ids: dict[str, Path] = {}
    for path in spec_paths:
        sid = heading_id(path)
        if not sid:
            fail(errors, f"Spec has no valid ID heading: {path.relative_to(ROOT)}")
            continue
        if sid in spec_ids:
            fail(errors, f"Duplicate spec ID {sid}: {path} and {spec_ids[sid]}")
        spec_ids[sid] = path

    task_ids: dict[str, Path] = {}
    for path in task_paths:
        tid = heading_id(path)
        if not tid:
            fail(errors, f"Task has no valid ID heading: {path.relative_to(ROOT)}")
            continue
        if tid in task_ids:
            fail(errors, f"Duplicate task ID {tid}: {path} and {task_ids[tid]}")
        task_ids[tid] = path

        text = path.read_text(encoding="utf-8")
        status_match = re.search(r"^Status:\s*(.+)$", text, re.MULTILINE)
        if not status_match or status_match.group(1).strip() not in ALLOWED_STATUS:
            fail(errors, f"Invalid/missing task status in {path.relative_to(ROOT)}")

        related = re.search(r"^Related specs:\s*(.+)$", text, re.MULTILINE)
        if not related:
            fail(errors, f"Missing Related specs in {path.relative_to(ROOT)}")
        else:
            for sid in [x.strip() for x in related.group(1).split(",")]:
                if sid not in spec_ids:
                    fail(errors, f"Unknown spec {sid} in {path.relative_to(ROOT)}")

        if "## Acceptance criteria" not in text or "## Verification commands" not in text:
            fail(errors, f"Task missing acceptance/verification section: {path.relative_to(ROOT)}")

        dependencies = re.search(r"^Depends on:\s*(.+)$", text, re.MULTILINE)
        if dependencies and dependencies.group(1).strip().lower() != "none":
            for dependency in re.findall(r"\b(?:BE|FE|INT)-\d{3}\b", dependencies.group(1)):
                # Checked after all task IDs are collected below.
                pass

        reading = text.split("## Required reading", 1)
        if len(reading) == 2:
            reading_body = reading[1].split("## ", 1)[0]
            for required_path in re.findall(r"`([^`]+)`", reading_body):
                if not (ROOT / required_path).exists():
                    fail(errors, f"Missing required-reading path in {path.relative_to(ROOT)}: {required_path}")

        for stale in re.findall(r"`(specs/(?:backend|frontend)/[A-Z]+-\d+\.md)`", text):
            fail(errors, f"Unresolved spec path in {path.relative_to(ROOT)}: {stale}")

    for tid, path in task_ids.items():
        text = path.read_text(encoding="utf-8")
        dependencies = re.search(r"^Depends on:\s*(.+)$", text, re.MULTILINE)
        if dependencies and dependencies.group(1).strip().lower() != "none":
            for dependency in re.findall(r"\b(?:BE|FE|INT)-\d{3}\b", dependencies.group(1)):
                if dependency not in task_ids:
                    fail(errors, f"Task {tid} depends on missing task {dependency}")

    order_text = (ROOT / "tasks/ORDER.md").read_text(encoding="utf-8")
    for tid in sorted(set(re.findall(r"\b(?:BE|FE|INT)-\d{3}\b", order_text))):
        if tid not in task_ids:
            fail(errors, f"tasks/ORDER.md references missing task {tid}")

    for sid, path in spec_ids.items():
        text = path.read_text(encoding="utf-8")
        section = text.split("## Related tasks", 1)
        if len(section) != 2:
            fail(errors, f"Spec {sid} has no Related tasks section")
            continue
        for tid in re.findall(r"\b(?:BE|FE|INT)-\d{3}\b", section[1]):
            if tid not in task_ids:
                fail(errors, f"Spec {sid} references missing task {tid}")

    validate_markdown_links(errors)

    if errors:
        print("Documentation validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        f"Documentation validation passed: {len(spec_ids)} specs, "
        f"{len(task_ids)} tasks, {len(list(ROOT.rglob('*.md')))} Markdown files."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

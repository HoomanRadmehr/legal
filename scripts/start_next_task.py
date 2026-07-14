#!/usr/bin/env python3
"""Print the first TODO task in the recommended order; does not edit files."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
order = (ROOT / "tasks/ORDER.md").read_text(encoding="utf-8")
seen = set()
for task_id in re.findall(r"\b(?:BE|FE|INT)-\d{3}\b", order):
    if task_id in seen:
        continue
    seen.add(task_id)
    matches = list((ROOT / "tasks").glob(f"*/{task_id}-*.md"))
    if not matches:
        continue
    text = matches[0].read_text(encoding="utf-8")
    status = re.search(r"^Status:\s*(.+)$", text, re.MULTILINE)
    if status and status.group(1).strip() == "TODO":
        print(matches[0].relative_to(ROOT))
        raise SystemExit(0)
print("No TODO task found in tasks/ORDER.md")

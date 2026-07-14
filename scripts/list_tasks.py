#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

rows = []
for path in sorted((ROOT / "tasks").glob("*/*.md")):
    text = path.read_text(encoding="utf-8")
    title = text.splitlines()[0].removeprefix("# ")
    status = re.search(r"^Status:\s*(.+)$", text, re.MULTILINE)
    area = path.parent.name
    rows.append((area, status.group(1).strip() if status else "UNKNOWN", title, path.relative_to(ROOT)))

for area, status, title, path in rows:
    print(f"{status:11} {area:11} {title:60} {path}")

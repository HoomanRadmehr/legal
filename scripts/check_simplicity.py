#!/usr/bin/env python3
"""Detect selected prohibited complexity patterns in Python and React code."""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_FUNCTION_LINES = 40
FORBIDDEN_CLASS_SUFFIXES = ("Service", "Selector", "Repository", "UnitOfWork")
FORBIDDEN_PYTHON_NAMES = {
    "GenericForeignKey",
    "GenericRelation",
    "ContentType",
    "abstractmethod",
    "ABC",
    "ABCMeta",
}


def scan_python(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(path))
    except (UnicodeDecodeError, SyntaxError) as exc:
        return [f"{path}: cannot parse Python: {exc}"]

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if len(node.bases) > 1:
                errors.append(f"{path}:{node.lineno}: multiple inheritance in {node.name}")
            for keyword in node.keywords:
                if keyword.arg == "metaclass":
                    errors.append(f"{path}:{node.lineno}: custom metaclass in {node.name}")
            if node.name.endswith(FORBIDDEN_CLASS_SUFFIXES):
                errors.append(
                    f"{path}:{node.lineno}: class-based service/selector/repository prohibited: {node.name}"
                )

        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            end = getattr(node, "end_lineno", node.lineno)
            if end - node.lineno + 1 > MAX_FUNCTION_LINES:
                errors.append(
                    f"{path}:{node.lineno}: function {node.name} spans "
                    f"{end - node.lineno + 1} lines (max {MAX_FUNCTION_LINES})"
                )
            max_depth = 0
            stack: list[tuple[ast.AST, int]] = [(node, 0)]
            while stack:
                current, depth = stack.pop()
                if isinstance(current, (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.With, ast.AsyncWith)):
                    depth += 1
                    max_depth = max(max_depth, depth)
                for child in ast.iter_child_nodes(current):
                    if child is not node:
                        stack.append((child, depth))
            if max_depth > 3:
                errors.append(
                    f"{path}:{node.lineno}: function {node.name} nesting depth {max_depth} (max 3)"
                )

        if isinstance(node, ast.Name) and node.id in FORBIDDEN_PYTHON_NAMES:
            errors.append(f"{path}:{node.lineno}: prohibited name {node.id}")
        if isinstance(node, ast.Attribute) and node.attr in FORBIDDEN_PYTHON_NAMES:
            errors.append(f"{path}:{node.lineno}: prohibited attribute {node.attr}")
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names: list[str] = []
            if isinstance(node, ast.ImportFrom):
                names.append(node.module or "")
                names.extend(alias.name for alias in node.names)
            else:
                names.extend(alias.name for alias in node.names)
            joined = " ".join(names)
            if "django.db.models.signals" in joined:
                errors.append(f"{path}:{node.lineno}: Django business signals are prohibited")
            if any(name in joined for name in FORBIDDEN_PYTHON_NAMES):
                errors.append(f"{path}:{node.lineno}: prohibited generic/polymorphic import")

    if re.search(r"@receiver\s*\(", source):
        errors.append(f"{path}: @receiver signal handler is prohibited for application business logic")
    return sorted(set(errors))


def scan_frontend(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors: list[str] = []
    patterns = [
        (r"\bclass\s+\w+\s+extends\s+(?:React\.)?(?:Component|PureComponent)\b", "React class component"),
        (r"\bclass\s+\w+\s+extends\s+\w+", "frontend class inheritance"),
        (r"\bwith[A-Z]\w*\s*\(", "possible higher-order component factory"),
    ]
    for pattern, label in patterns:
        for match in re.finditer(pattern, text):
            line = text.count("\n", 0, match.start()) + 1
            errors.append(f"{path}:{line}: prohibited {label}")
    return errors


def main(argv: list[str]) -> int:
    targets = argv[1:] or ["backend", "frontend"]
    errors: list[str] = []
    scanned = 0
    for target in targets:
        base = (ROOT / target).resolve()
        if not base.exists():
            continue
        for path in base.rglob("*.py"):
            if any(part in {".venv", "venv", "node_modules", "migrations"} for part in path.parts):
                continue
            scanned += 1
            errors.extend(scan_python(path))
        for suffix in ("*.ts", "*.tsx", "*.js", "*.jsx"):
            for path in base.rglob(suffix):
                if "node_modules" in path.parts or "generated" in path.parts:
                    continue
                scanned += 1
                errors.extend(scan_frontend(path))

    if errors:
        print("Simplicity check failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Simplicity check passed: scanned {scanned} source files.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

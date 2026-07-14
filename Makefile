.PHONY: docs-check simplicity-check list-tasks

docs-check:
	python scripts/validate_docs.py

simplicity-check:
	python scripts/check_simplicity.py backend frontend

list-tasks:
	python scripts/list_tasks.py

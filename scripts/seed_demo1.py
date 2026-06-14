#!/usr/bin/env python3
"""Reset DB and seed Demo 1 demonstration data.

Scope (Этап 6): users/roles, org structure, compensation, timesheets.
Does not seed knowledge base or sales — those are mocked in frontend_demos.

Usage:
    CONFIG_PATH=backend/shared/settings/config.demo.yaml just demo1-seed
    CONFIG_PATH=backend/shared/settings/config.demo.yaml python scripts/seed_demo1.py
"""
import asyncio
import os
import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from scripts.seed_demo import main_demo1  # noqa: E402


if __name__ == "__main__":
    asyncio.run(main_demo1())

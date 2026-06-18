"""Conftest for report_service tests — adds report_service to sys.path."""
import sys
from pathlib import Path

# Ensure report_service root is importable as `app.*`
_REPORT_SERVICE_ROOT = str(Path(__file__).parent.parent)
if _REPORT_SERVICE_ROOT not in sys.path:
    sys.path.insert(0, _REPORT_SERVICE_ROOT)

# Ensure shared modules from backend root are importable
_BACKEND_ROOT = str(Path(__file__).parent.parent.parent)
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

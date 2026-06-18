"""Tests for GenerateLearningXlsxUseCase."""
import asyncio
from contextlib import asynccontextmanager
from io import BytesIO
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.reports.db_models import ParseStatus, ReportJobModel
from app.reports.usecases.generate_learning_xlsx_usecase import GenerateLearningXlsxUseCase


# ------------------------------------------------------------------ #
# Helpers                                                             #
# ------------------------------------------------------------------ #


def _make_db_with_job(job: ReportJobModel):
    """Return a mock Database whose transaction() yields a session with `job`."""
    session = AsyncMock()
    session.get = AsyncMock(return_value=job)

    @asynccontextmanager
    async def _transaction():
        yield session

    db = MagicMock()
    db.transaction = _transaction
    return db, session


def _make_replica(rows: list[dict] | None = None):
    """Return a mock MainReplicaDatabase whose read_only_transaction yields fake rows."""
    rows = rows or []
    fake_rows = []
    for r in rows:
        row_mock = MagicMock()
        row_mock._mapping = r
        fake_rows.append(row_mock)

    async def _execute(sql, params=None):
        result = MagicMock()
        result.__iter__ = MagicMock(return_value=iter(fake_rows))
        return result

    replica_session = AsyncMock()
    replica_session.execute = _execute

    @asynccontextmanager
    async def _read_only_transaction():
        yield replica_session

    replica = MagicMock()
    replica.read_only_transaction = _read_only_transaction
    return replica


# ------------------------------------------------------------------ #
# _build_xlsx tests (synchronous — run in main thread)               #
# ------------------------------------------------------------------ #


class TestBuildXlsx:
    def test_learning_users_produces_valid_workbook(self) -> None:
        try:
            import openpyxl
        except ImportError:
            pytest.skip("openpyxl not installed")

        db, _ = _make_db_with_job(MagicMock())
        uc = GenerateLearningXlsxUseCase(db=db, main_replica=_make_replica(), kafka_producer=MagicMock())

        rows = [
            {
                "last_name": "Иванов", "first_name": "Иван", "middle_name": "Иванович",
                "external_system_id": "EMP001",
                "block_name": "Блок 1", "location_name": "Точка 1",
                "course_name": "Курс А",
                "points_earned": 80, "points_max": 100,
                "is_course_completed_successfully": True,
                "is_course_completed": True,
            }
        ]

        xlsx_bytes = uc._build_xlsx("learning_users", rows)
        assert isinstance(xlsx_bytes, bytes) and len(xlsx_bytes) > 0

        wb = openpyxl.load_workbook(BytesIO(xlsx_bytes))
        ws = wb.active
        headers = [ws.cell(1, col).value for col in range(1, 12)]
        assert "Фамилия" in headers
        assert "Курс" in headers
        assert ws.cell(2, 1).value == "Иванов"

    def test_learning_by_block_produces_valid_workbook(self) -> None:
        try:
            import openpyxl
        except ImportError:
            pytest.skip("openpyxl not installed")

        db, _ = _make_db_with_job(MagicMock())
        uc = GenerateLearningXlsxUseCase(db=db, main_replica=_make_replica(), kafka_producer=MagicMock())

        rows = [{"block_name": "Блок 1", "employee_count": 5, "enrollment_count": 10, "completed_count": 3, "avg_pct": 60.5}]
        xlsx_bytes = uc._build_xlsx("learning_by_block", rows)

        wb = openpyxl.load_workbook(BytesIO(xlsx_bytes))
        ws = wb.active
        assert ws.cell(1, 1).value == "Блок"
        assert ws.cell(2, 1).value == "Блок 1"

    def test_learning_by_location_produces_valid_workbook(self) -> None:
        try:
            import openpyxl
        except ImportError:
            pytest.skip("openpyxl not installed")

        db, _ = _make_db_with_job(MagicMock())
        uc = GenerateLearningXlsxUseCase(db=db, main_replica=_make_replica(), kafka_producer=MagicMock())

        rows = [{"location_code": "LOC01", "location_name": "Точка 1", "block_name": "Блок 1",
                 "employee_count": 3, "enrollment_count": 5, "completed_count": 2, "avg_pct": 40.0}]
        xlsx_bytes = uc._build_xlsx("learning_by_location", rows)

        wb = openpyxl.load_workbook(BytesIO(xlsx_bytes))
        ws = wb.active
        assert ws.cell(1, 1).value == "Код"
        assert ws.cell(2, 1).value == "LOC01"

    def test_learning_rating_produces_valid_workbook(self) -> None:
        try:
            import openpyxl
        except ImportError:
            pytest.skip("openpyxl not installed")

        db, _ = _make_db_with_job(MagicMock())
        uc = GenerateLearningXlsxUseCase(db=db, main_replica=_make_replica(), kafka_producer=MagicMock())

        rows = [{"rank": 1, "last_name": "Петров", "first_name": "Пётр", "external_system_id": "EMP002",
                 "metric_value": 300, "secondary_value": 75.0, "block_name": "Блок 2", "location_name": "Точка 2"}]
        xlsx_bytes = uc._build_xlsx("learning_rating", rows)

        wb = openpyxl.load_workbook(BytesIO(xlsx_bytes))
        ws = wb.active
        assert ws.cell(1, 1).value == "Место"
        assert ws.cell(2, 1).value == 1


# ------------------------------------------------------------------ #
# execute() integration test                                          #
# ------------------------------------------------------------------ #


class TestExecute:
    async def test_execute_sets_completed_status_and_publishes_kafka(self) -> None:
        try:
            import openpyxl  # noqa: F401
        except ImportError:
            pytest.skip("openpyxl not installed")

        job_id = uuid4()
        job = MagicMock()
        job.parse_status = ParseStatus.PENDING.value

        db, session = _make_db_with_job(job)
        replica = _make_replica(rows=[])
        kafka = MagicMock()
        kafka.send = AsyncMock()

        uc = GenerateLearningXlsxUseCase(db=db, main_replica=replica, kafka_producer=kafka)
        await uc.execute(
            job_id=job_id,
            report_type="learning_by_block",
            scope_type="network",
            scope_id=None,
            period_from=None,
            period_to=None,
        )

        # Job must reach completed state
        assert job.parse_status == ParseStatus.COMPLETED.value
        assert job.s3_file_key is not None
        assert str(job_id) in job.s3_file_key
        assert job.completed_at is not None

        # Kafka must have been called once with the learning_report topic
        kafka.send.assert_awaited_once()
        topic = kafka.send.call_args[0][0]
        assert "learning_report" in topic

    async def test_execute_sets_failed_status_on_error(self) -> None:
        job_id = uuid4()
        job = MagicMock()
        job.parse_status = ParseStatus.PENDING.value

        db, session = _make_db_with_job(job)

        # Replica raises an exception
        broken_replica = MagicMock()

        @asynccontextmanager
        async def _broken_tx():
            raise RuntimeError("DB down")
            yield  # noqa: unreachable

        broken_replica.read_only_transaction = _broken_tx

        kafka = MagicMock()
        kafka.send = AsyncMock()

        uc = GenerateLearningXlsxUseCase(db=db, main_replica=broken_replica, kafka_producer=kafka)
        await uc.execute(
            job_id=job_id,
            report_type="learning_users",
            scope_type="network",
            scope_id=None,
            period_from=None,
            period_to=None,
        )

        # Must fall back to failed
        assert job.parse_status == ParseStatus.FAILED.value
        kafka.send.assert_not_awaited()

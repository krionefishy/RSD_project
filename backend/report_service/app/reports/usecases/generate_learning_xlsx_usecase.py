import asyncio
import logging
from datetime import datetime
from io import BytesIO
from uuid import UUID

from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.kafka_streams.storage_events import publish_s3_upload
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.db_models import ParseStatus, ReportJobModel
from storage.pg.database import Database
from storage.pg.main_replica import MainReplicaDatabase

logger = logging.getLogger(__name__)

CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


class GenerateLearningXlsxUseCase:
    def __init__(
        self,
        db: Database,
        main_replica: MainReplicaDatabase,
        kafka_producer: KafkaProducerWrapper,
    ):
        self._db = db
        self._main_replica = main_replica
        self._kafka_producer = kafka_producer

    async def execute(
        self,
        job_id: UUID,
        report_type: str,
        scope_type: str,
        scope_id: int | None,
        period_from: str | None,
        period_to: str | None,
    ) -> None:
        try:
            await self._update_status(job_id, ParseStatus.PROCESSING)

            async with self._main_replica.read_only_transaction() as replica:
                rows = await self._fetch_data(
                    replica,
                    report_type,
                    scope_type,
                    scope_id,
                    period_from=period_from,
                    period_to=period_to,
                )

            xlsx_bytes = await asyncio.to_thread(
                self._build_xlsx, report_type, rows
            )
            s3_file_key = f"learning_reports/{job_id}/{report_type}.xlsx"

            await self._update_status(
                job_id,
                ParseStatus.COMPLETED,
                s3_file_key=s3_file_key,
            )
            await publish_s3_upload(
                self._kafka_producer,
                StorageTopics.LEARNING_REPORT_UPLOAD,
                key=s3_file_key,
                body=xlsx_bytes,
                content_type=CONTENT_TYPE,
                original_filename=f"{report_type}.xlsx",
            )
        except Exception:
            logger.exception("Learning XLSX generation failed for job %s", job_id)
            await self._update_status(job_id, ParseStatus.FAILED)

    # ------------------------------------------------------------------ #
    # DB helpers                                                           #
    # ------------------------------------------------------------------ #

    async def _update_status(
        self,
        job_id: UUID,
        status: ParseStatus,
        s3_file_key: str | None = None,
    ) -> None:
        async with self._db.transaction() as session:
            job: ReportJobModel | None = await session.get(ReportJobModel, job_id)
            if job is None:
                return
            job.parse_status = status.value
            if s3_file_key is not None:
                job.s3_file_key = s3_file_key
            if status == ParseStatus.COMPLETED:
                job.completed_at = datetime.now()

    async def _fetch_data(
        self,
        session: AsyncSession,
        report_type: str,
        scope_type: str,
        scope_id: int | None,
        period_from: str | None = None,
        period_to: str | None = None,
    ) -> list[dict]:
        if report_type == "learning_users":
            return await self._query_learning_users(session, scope_type, scope_id)
        if report_type == "learning_by_block":
            return await self._query_learning_by_block(session, scope_type, scope_id)
        if report_type == "learning_by_location":
            return await self._query_learning_by_location(session, scope_type, scope_id)
        if report_type == "learning_rating":
            return await self._query_learning_rating(
                session,
                scope_type,
                scope_id,
                period_from=period_from,
                period_to=period_to,
            )
        return []

    # ------------------------------------------------------------------ #
    # SQL queries                                                          #
    # ------------------------------------------------------------------ #

    async def _query_learning_users(
        self,
        session: AsyncSession,
        scope_type: str,
        scope_id: int | None,
    ) -> list[dict]:
        scope_filter = self._user_scope_filter(scope_type, scope_id)
        sql = text(f"""
            SELECT
                u.last_name,
                u.first_name,
                u.middle_name,
                u.external_system_id,
                b.name        AS block_name,
                l.name        AS location_name,
                c.name        AS course_name,
                count(DISTINCT CASE WHEN ucm.is_completed THEN ucm.material_id END) AS completed_materials,
                count(DISTINCT cm.material_id) AS total_materials,
                count(DISTINCT CASE WHEN uct.is_passed AND uct.completed_at IS NOT NULL THEN uct.test_id END) AS passed_tests,
                count(DISTINCT ct.test_id) AS total_tests,
                cu.user_points_by_course AS points_earned,
                cu.is_course_completed_successfully,
                cu.is_course_completed,
                CASE
                    WHEN c.rating_points > 0
                        THEN round(LEAST(cu.user_points_by_course::numeric / c.rating_points * 100, 100), 1)
                    WHEN cu.is_course_completed
                        THEN 100.0
                    ELSE 0.0
                END AS completion_pct
            FROM course_users cu
            JOIN users   u ON u.id  = cu.user_id
            JOIN courses c ON c.id  = cu.course_id
            LEFT JOIN course_materials cm
                ON cm.course_id = cu.course_id
            LEFT JOIN user_course_materials ucm
                ON ucm.user_id = cu.user_id
               AND ucm.course_id = cu.course_id
               AND ucm.material_id = cm.material_id
               AND ucm.is_completed = true
            LEFT JOIN course_tests ct
                ON ct.course_id = cu.course_id
            LEFT JOIN user_course_tests uct
                ON uct.user_id = cu.user_id
               AND uct.course_id = cu.course_id
               AND uct.test_id = ct.test_id
            LEFT JOIN block_members  bm ON bm.user_id  = u.id
            LEFT JOIN blocks          b ON b.id         = bm.block_id
            LEFT JOIN block_locations bl ON bl.block_id = bm.block_id
            LEFT JOIN locations        l ON l.id        = bl.location_id
            {scope_filter}
            GROUP BY
                u.last_name,
                u.first_name,
                u.middle_name,
                u.external_system_id,
                b.name,
                l.name,
                c.name,
                c.rating_points,
                cu.user_points_by_course,
                cu.is_course_completed_successfully,
                cu.is_course_completed
            ORDER BY u.last_name, u.first_name, c.name
        """)
        params = self._scope_params(scope_type, scope_id)
        result = await session.execute(sql, params)
        return [dict(r._mapping) for r in result]

    async def _query_learning_by_block(
        self,
        session: AsyncSession,
        scope_type: str,  # noqa: ARG002 — always network-wide, kept for consistency
        scope_id: int | None,  # noqa: ARG002
    ) -> list[dict]:
        sql = text("""
            SELECT
                b.name                                    AS block_name,
                count(DISTINCT bm.user_id)                AS employee_count,
                count(cu.user_id)                         AS enrollment_count,
                coalesce(sum(cu.is_course_completed_successfully::int), 0) AS completed_count,
                round(
                    coalesce(
                        avg(
                            CASE WHEN c.rating_points > 0
                                 THEN cu.user_points_by_course::float / c.rating_points * 100
                                 ELSE 0
                            END
                        ), 0
                    )::numeric, 1
                ) AS avg_pct
            FROM blocks b
            LEFT JOIN block_members  bm ON bm.block_id = b.id
            LEFT JOIN course_users   cu ON cu.user_id  = bm.user_id
            LEFT JOIN courses         c ON c.id        = cu.course_id
            GROUP BY b.id, b.name
            ORDER BY b.name
        """)
        result = await session.execute(sql)
        return [dict(r._mapping) for r in result]

    async def _query_learning_by_location(
        self,
        session: AsyncSession,
        scope_type: str,
        scope_id: int | None,
    ) -> list[dict]:
        block_filter = ""
        if scope_type == "block" and scope_id is not None:
            block_filter = "WHERE bl.block_id = :scope_id"
        sql = text(f"""
            SELECT
                l.code                                    AS location_code,
                l.name                                    AS location_name,
                b.name                                    AS block_name,
                count(DISTINCT bm.user_id)                AS employee_count,
                count(cu.user_id)                         AS enrollment_count,
                coalesce(sum(cu.is_course_completed_successfully::int), 0) AS completed_count,
                round(
                    coalesce(
                        avg(
                            CASE WHEN c.rating_points > 0
                                 THEN cu.user_points_by_course::float / c.rating_points * 100
                                 ELSE 0
                            END
                        ), 0
                    )::numeric, 1
                ) AS avg_pct
            FROM locations l
            LEFT JOIN block_locations bl ON bl.location_id = l.id
            LEFT JOIN blocks           b ON b.id            = bl.block_id
            LEFT JOIN block_members   bm ON bm.block_id    = bl.block_id
            LEFT JOIN course_users    cu ON cu.user_id      = bm.user_id
            LEFT JOIN courses          c ON c.id            = cu.course_id
            {block_filter}
            GROUP BY l.id, l.code, l.name, b.id, b.name
            ORDER BY b.name, l.name
        """)
        params = {"scope_id": scope_id} if scope_id is not None else {}
        result = await session.execute(sql, params)
        return [dict(r._mapping) for r in result]

    async def _query_learning_rating(
        self,
        session: AsyncSession,
        scope_type: str,
        scope_id: int | None,
        *,
        period_from: str | None = None,
        period_to: str | None = None,
    ) -> list[dict]:
        period_filter = ""
        params = {"scope_type": scope_type, "scope_id": scope_id}
        if period_from is not None:
            period_filter += " AND period_from >= :period_from"
            params["period_from"] = period_from
        if period_to is not None:
            period_filter += " AND period_to <= :period_to"
            params["period_to"] = period_to

        sql = text("""
            WITH latest_snapshot AS (
                SELECT id FROM rating_snapshots
                WHERE rating_type = 'learning'
                  AND scope_type  = :scope_type
                  AND CASE WHEN :scope_id IS NULL
                           THEN scope_id IS NULL
                           ELSE scope_id = :scope_id
                      END
                  {period_filter}
                ORDER BY calculated_at DESC
                LIMIT 1
            )
            SELECT
                rsi.rank,
                u.last_name,
                u.first_name,
                u.external_system_id,
                rsi.metric_value,
                rsi.secondary_value,
                b.name AS block_name,
                l.name AS location_name
            FROM rating_snapshot_items rsi
            JOIN latest_snapshot ls  ON ls.id    = rsi.snapshot_id
            JOIN users            u  ON u.id     = rsi.user_id
            LEFT JOIN block_members  bm ON bm.user_id  = u.id
            LEFT JOIN blocks          b ON b.id         = bm.block_id
            LEFT JOIN block_locations bl ON bl.block_id = bm.block_id
            LEFT JOIN locations        l ON l.id        = bl.location_id
            ORDER BY rsi.rank
        """.replace("{period_filter}", period_filter))
        result = await session.execute(sql, params)
        return [dict(r._mapping) for r in result]

    # ------------------------------------------------------------------ #
    # Scope helpers                                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _user_scope_filter(scope_type: str, scope_id: int | None) -> str:
        if scope_type == "block" and scope_id is not None:
            return "WHERE bm.block_id = :scope_id"
        if scope_type == "location" and scope_id is not None:
            return "WHERE bl.location_id = :scope_id"
        return ""

    @staticmethod
    def _scope_params(scope_type: str, scope_id: int | None) -> dict:
        if scope_id is not None and scope_type in ("block", "location"):
            return {"scope_id": scope_id}
        return {}

    # ------------------------------------------------------------------ #
    # XLSX builder (runs in a thread pool)                                 #
    # ------------------------------------------------------------------ #

    def _build_xlsx(self, report_type: str, rows: list[dict]) -> bytes:
        import openpyxl  # imported here so the module loads lazily in workers
        from openpyxl.styles import Font, PatternFill
        from openpyxl.utils import get_column_letter

        wb = openpyxl.Workbook()
        ws = wb.active

        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill("solid", fgColor="2E5BFF")

        if report_type == "learning_users":
            headers = [
                "Фамилия", "Имя", "Отчество", "Таб. номер",
                "Блок", "Точка", "Курс",
                "Материалы", "Тесты", "Баллы", "Статус курса", "Процент обучения",
            ]
            ws.append(headers)
            for row in rows:
                if row.get("is_course_completed_successfully"):
                    status = "Завершён успешно"
                elif row.get("is_course_completed"):
                    status = "Завершён"
                else:
                    status = "Не завершён"
                ws.append([
                    row.get("last_name") or "",
                    row.get("first_name") or "",
                    row.get("middle_name") or "",
                    row.get("external_system_id") or "",
                    row.get("block_name") or "",
                    row.get("location_name") or "",
                    row.get("course_name") or "",
                    f"{int(row.get('completed_materials') or 0)}/{int(row.get('total_materials') or 0)}",
                    f"{int(row.get('passed_tests') or 0)}/{int(row.get('total_tests') or 0)}",
                    int(row.get("points_earned") or 0),
                    status,
                    float(row.get("completion_pct") or 0),
                ])

        elif report_type == "learning_by_block":
            headers = ["Блок", "Сотрудников", "Зачислений", "Завершили", "Средний %"]
            ws.append(headers)
            for row in rows:
                ws.append([
                    row.get("block_name") or "",
                    row.get("employee_count") or 0,
                    row.get("enrollment_count") or 0,
                    row.get("completed_count") or 0,
                    float(row.get("avg_pct") or 0),
                ])

        elif report_type == "learning_by_location":
            headers = ["Код", "Точка", "Блок", "Сотрудников", "Зачислений", "Завершили", "Средний %"]
            ws.append(headers)
            for row in rows:
                ws.append([
                    row.get("location_code") or "",
                    row.get("location_name") or "",
                    row.get("block_name") or "",
                    row.get("employee_count") or 0,
                    row.get("enrollment_count") or 0,
                    row.get("completed_count") or 0,
                    float(row.get("avg_pct") or 0),
                ])

        elif report_type == "learning_rating":
            headers = ["Место", "Фамилия", "Имя", "Таб. номер", "Баллы", "% курсов", "Блок", "Точка"]
            ws.append(headers)
            for row in rows:
                ws.append([
                    row.get("rank") or 0,
                    row.get("last_name") or "",
                    row.get("first_name") or "",
                    row.get("external_system_id") or "",
                    float(row.get("metric_value") or 0),
                    float(row.get("secondary_value") or 0),
                    row.get("block_name") or "",
                    row.get("location_name") or "",
                ])

        ws.title = report_type
        for col_idx, _ in enumerate(ws[1], start=1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            ws.column_dimensions[get_column_letter(col_idx)].width = 18

        buf = BytesIO()
        wb.save(buf)
        return buf.getvalue()

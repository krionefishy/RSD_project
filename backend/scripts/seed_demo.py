"""Reset and seed the database with demo data.

The script is intentionally destructive and only runs when the loaded config
has environment set to "demo".

Account definitions live in demo_accounts.json (same IDs as the login screen in demo mode).

Usage:
    CONFIG_PATH=backend/shared/settings/config.demo.yaml python -m backend.scripts.seed_demo
"""

import asyncio
import json
import logging
import os
import sys
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared.settings.config import Settings, load_settings
from storage.pg.database import Base

from app.auth.password import PasswordService
from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseModel,
    CourseTestModel,
    CourseUserModel,
    MaterialModel,
    TestModel,
    TestTaskAssignmentModel,
    TestTaskModel,
    UserCourseMaterialModel,
    UserCourseTestModel,
)
from app.locations.db_models import (
    BlockLocationModel,
    BlockMemberModel,
    BlockMemberStatus,
    BlockModel,
    LocationModel,
    ManagerBlockModel,
    UserLocationModel,
)
from app.personnel.db_models import (
    ActivityCodeModel,
    ActivityEntryType,
    EmployeeCompensationModel,
    EmployeeTimeEntryModel,
    ShiftType,
)
from app.reports import db_models as _reports_models  # noqa: F401
from app.sellings import db_models as _sellings_models  # noqa: F401
from app.users.db_models import UserModel, UserRole

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed_demo")

_SCRIPT_DIR = Path(__file__).resolve().parent
_DEMO_ACCOUNTS_PATH = _SCRIPT_DIR / "demo_accounts.json"


def _load_demo_accounts() -> tuple[str, list[dict[str, Any]]]:
    data = json.loads(_DEMO_ACCOUNTS_PATH.read_text(encoding="utf-8"))
    password = data["password"]
    users = data["users"]
    roles_present = {entry["role"] for entry in users}
    expected = {role.value for role in UserRole}
    missing = expected - roles_present
    if missing:
        raise RuntimeError(f"demo_accounts.json is missing roles: {sorted(missing)}")
    return password, users


def _config_path() -> str | None:
    return os.getenv("CONFIG_PATH")


def _normalize_db_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


_DEMO_SEED_ENVIRONMENTS = frozenset({"demo", "docker"})


def _load_demo_settings() -> Settings:
    settings = load_settings(_config_path())
    if settings.env_mode not in _DEMO_SEED_ENVIRONMENTS:
        raise RuntimeError(
            f"Refusing to reset database: config environment is {settings.env_mode!r}, "
            f"expected one of {sorted(_DEMO_SEED_ENVIRONMENTS)}."
        )
    return settings


async def _reset_database(session: AsyncSession) -> None:
    table_names = [f'"{table.name}"' for table in Base.metadata.sorted_tables]
    if not table_names:
        raise RuntimeError("No SQLAlchemy tables found in metadata.")

    await session.execute(text(f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE"))
    await session.commit()
    logger.info("Database tables truncated: %s", len(table_names))


async def _seed_users(session: AsyncSession, password: str, accounts: list[dict[str, Any]]) -> dict[str, UserModel]:
    hashed = PasswordService.hash(password)
    users: dict[str, UserModel] = {}

    for entry in accounts:
        user = UserModel(
            external_system_id=entry["external_system_id"],
            hashed_password=hashed,
            role=UserRole(entry["role"]),
            first_name=entry.get("first_name"),
            last_name=entry.get("last_name"),
            phone=entry.get("phone"),
            position=entry.get("position"),
            is_active=entry.get("is_active", True),
        )
        users[entry["key"]] = user

    session.add_all(users.values())
    await session.flush()
    return users


def _log_demo_credentials(password: str, accounts: list[dict[str, Any]]) -> None:
    login_accounts = [a for a in accounts if a.get("show_on_login", False)]
    logger.info("Demo database has been reset and seeded.")
    logger.info("Default password for all demo users: %s", password)
    logger.info("Quick-login accounts (also shown on the login screen in demo mode):")
    for entry in login_accounts:
        logger.info("  %-22s  %s", entry["label"], entry["external_system_id"])
    logger.info("Config path: %s", Path(_config_path() or "").resolve() if _config_path() else "default")


def _hours(value: str) -> Decimal:
    return Decimal(value)


def _completed_at(day: int, hour: int = 10) -> datetime:
    return datetime(2026, 6, day, hour, 0, 0)


def _append_shift(
    entries: list[EmployeeTimeEntryModel],
    user_id,
    work_date: date,
    shift_code: str,
    *,
    hours: str,
    starts_at: time | None = None,
    ends_at: time | None = None,
) -> None:
    if shift_code in {"С1", "С2"}:
        activity_code = "Я"
        shift_type = ShiftType.DAY.value
    elif shift_code == "В":
        activity_code = "В"
        shift_type = ShiftType.NONE.value
    else:
        activity_code = "Б"
        shift_type = ShiftType.NONE.value

    entries.append(
        EmployeeTimeEntryModel(
            user_id=user_id,
            work_date=work_date,
            activity_code=activity_code,
            hours=_hours(hours),
            shift_type=shift_type,
            shift_code=shift_code,
            starts_at=starts_at,
            ends_at=ends_at,
        )
    )


def _schedule_range(start: date, codes: list[str]) -> list[tuple[date, str]]:
    return [(start + timedelta(days=index), code) for index, code in enumerate(codes)]


async def _seed_locations(session: AsyncSession, users: dict[str, UserModel]) -> None:
    north = BlockModel(name="Северный блок", description="Демо-блок для менеджера")
    south = BlockModel(name="Южный блок", description="Демо-блок для второго менеджера")
    metro = LocationModel(
        code="MSK-METRO",
        name="ТЦ Метрополис",
        address="Москва, Ленинградское шоссе, 16А",
        city="Москва",
        s1_start_at=time(5, 0),
        s1_end_at=time(13, 30),
        s2_start_at=time(13, 30),
        s2_end_at=time(22, 0),
    )
    aviapark = LocationModel(
        code="MSK-AVIAPARK",
        name="ТЦ Авиапарк",
        address="Москва, Ходынский бульвар, 4",
        city="Москва",
        s1_start_at=time(5, 0),
        s1_end_at=time(13, 30),
        s2_start_at=time(13, 30),
        s2_end_at=time(22, 0),
    )
    europe = LocationModel(
        code="MSK-EURO",
        name="ТЦ Европарк",
        address="Москва, Рублевское шоссе, 62",
        city="Москва",
        s1_start_at=time(5, 0),
        s1_end_at=time(13, 30),
        s2_start_at=time(13, 30),
        s2_end_at=time(22, 0),
    )
    crocus = LocationModel(
        code="MSK-CROCUS",
        name="ТЦ Крокус Сити",
        address="Московская область, Красногорск, Международная улица, 12",
        city="Красногорск",
        s1_start_at=time(6, 0),
        s1_end_at=time(14, 0),
        s2_start_at=time(14, 0),
        s2_end_at=time(22, 0),
    )

    session.add_all([north, south, metro, aviapark, europe, crocus])
    await session.flush()

    session.add_all(
        [
            BlockLocationModel(block_id=north.id, location_id=metro.id),
            BlockLocationModel(block_id=north.id, location_id=aviapark.id),
            BlockLocationModel(block_id=south.id, location_id=europe.id),
            BlockLocationModel(block_id=south.id, location_id=crocus.id),
            ManagerBlockModel(manager_id=users["manager_north"].id, block_id=north.id),
            ManagerBlockModel(manager_id=users["manager_south"].id, block_id=south.id),
            BlockMemberModel(
                user_id=users["seller_anna"].id, block_id=north.id, status=BlockMemberStatus.PRIMARY.value
            ),
            BlockMemberModel(
                user_id=users["seller_kirill"].id, block_id=north.id, status=BlockMemberStatus.PRIMARY.value
            ),
            BlockMemberModel(
                user_id=users["seller_maria"].id, block_id=north.id, status=BlockMemberStatus.PRIMARY.value
            ),
            BlockMemberModel(
                user_id=users["seller_ivan"].id, block_id=north.id, status=BlockMemberStatus.RESERVE.value
            ),
            BlockMemberModel(
                user_id=users["seller_denis"].id, block_id=south.id, status=BlockMemberStatus.PRIMARY.value
            ),
            BlockMemberModel(
                user_id=users["seller_svetlana"].id, block_id=south.id, status=BlockMemberStatus.PRIMARY.value
            ),
            BlockMemberModel(
                user_id=users["seller_olga"].id, block_id=south.id, status=BlockMemberStatus.RESERVE.value
            ),
            UserLocationModel(user_id=users["seller_anna"].id, location_id=metro.id),
            UserLocationModel(user_id=users["seller_kirill"].id, location_id=metro.id),
            UserLocationModel(user_id=users["seller_maria"].id, location_id=aviapark.id),
            UserLocationModel(user_id=users["seller_ivan"].id, location_id=aviapark.id),
            UserLocationModel(user_id=users["seller_denis"].id, location_id=europe.id),
            UserLocationModel(user_id=users["seller_svetlana"].id, location_id=crocus.id),
            UserLocationModel(user_id=users["seller_olga"].id, location_id=crocus.id),
        ]
    )


async def _seed_personnel(session: AsyncSession, users: dict[str, UserModel]) -> None:
    session.add_all(
        [
            ActivityCodeModel(
                code="Я",
                name="Явка дневная",
                entry_type=ActivityEntryType.WORK.value,
                default_hours=Decimal("8.00"),
                is_paid=True,
                is_worked_time=True,
            ),
            ActivityCodeModel(
                code="Н",
                name="Ночная смена",
                entry_type=ActivityEntryType.WORK.value,
                default_hours=Decimal("8.00"),
                is_paid=True,
                is_worked_time=True,
            ),
            ActivityCodeModel(
                code="В",
                name="Выходной",
                entry_type=ActivityEntryType.DAY_OFF.value,
                default_hours=Decimal("0.00"),
                is_paid=False,
                is_worked_time=False,
            ),
            ActivityCodeModel(
                code="Б",
                name="Больничный",
                entry_type=ActivityEntryType.ABSENCE.value,
                default_hours=Decimal("0.00"),
                is_paid=False,
                is_worked_time=False,
            ),
            ActivityCodeModel(
                code="О",
                name="Отпуск",
                entry_type=ActivityEntryType.ABSENCE.value,
                default_hours=Decimal("0.00"),
                is_paid=True,
                is_worked_time=False,
            ),
        ]
    )
    session.add_all(
        [
            EmployeeCompensationModel(
                user_id=users["seller_anna"].id,
                base_salary=Decimal("45000.00"),
                hourly_rate=Decimal("350.00"),
                night_hourly_rate=Decimal("450.00"),
            ),
            EmployeeCompensationModel(
                user_id=users["seller_kirill"].id,
                base_salary=Decimal("52000.00"),
                hourly_rate=Decimal("410.00"),
                night_hourly_rate=Decimal("520.00"),
            ),
            EmployeeCompensationModel(
                user_id=users["seller_olga"].id,
                base_salary=Decimal("30000.00"),
                hourly_rate=Decimal("280.00"),
                night_hourly_rate=None,
            ),
            EmployeeCompensationModel(
                user_id=users["seller_maria"].id,
                base_salary=Decimal("47000.00"),
                hourly_rate=Decimal("360.00"),
                night_hourly_rate=Decimal("460.00"),
            ),
            EmployeeCompensationModel(
                user_id=users["seller_ivan"].id,
                base_salary=Decimal("44000.00"),
                hourly_rate=Decimal("340.00"),
                night_hourly_rate=Decimal("440.00"),
            ),
            EmployeeCompensationModel(
                user_id=users["seller_denis"].id,
                base_salary=Decimal("55000.00"),
                hourly_rate=Decimal("430.00"),
                night_hourly_rate=Decimal("530.00"),
            ),
            EmployeeCompensationModel(
                user_id=users["seller_svetlana"].id,
                base_salary=Decimal("46000.00"),
                hourly_rate=Decimal("355.00"),
                night_hourly_rate=Decimal("455.00"),
            ),
        ]
    )
    entries: list[EmployeeTimeEntryModel] = []
    june_start = date(2026, 6, 15)

    for work_date, shift_code in _schedule_range(june_start, ["С1", "С2", "В", "С1", "С1", "В", "С2"]):
        _append_shift(
            entries,
            users["seller_anna"].id,
            work_date,
            shift_code,
            hours="8.50" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["С2", "В", "С1", "С2", "В", "С2", "С1"]):
        _append_shift(
            entries,
            users["seller_kirill"].id,
            work_date,
            shift_code,
            hours="8.50" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["С1", "С1", "С2", "В", "С1", "С2", "В"]):
        _append_shift(
            entries,
            users["seller_maria"].id,
            work_date,
            shift_code,
            hours="8.50" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["В", "С2", "С1", "С1", "О/Б", "С2", "С1"]):
        _append_shift(
            entries,
            users["seller_ivan"].id,
            work_date,
            shift_code,
            hours="8.50" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["С1", "С2", "С1", "С2", "В", "С1", "С2"]):
        _append_shift(
            entries,
            users["seller_denis"].id,
            work_date,
            shift_code,
            hours="8.00" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["С2", "С1", "В", "С2", "С1", "В", "С2"]):
        _append_shift(
            entries,
            users["seller_svetlana"].id,
            work_date,
            shift_code,
            hours="8.00" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )
    for work_date, shift_code in _schedule_range(june_start, ["О/Б", "О/Б", "О/Б", "С1", "В", "О/Б", "С2"]):
        _append_shift(
            entries,
            users["seller_olga"].id,
            work_date,
            shift_code,
            hours="8.50" if shift_code in {"С1", "С2"} else "0.00",
            starts_at=time(5, 0) if shift_code == "С1" else time(13, 30) if shift_code == "С2" else None,
            ends_at=time(13, 30) if shift_code == "С1" else time(22, 0) if shift_code == "С2" else None,
        )

    session.add_all(entries)


async def _seed_knowledge_base(session: AsyncSession, users: dict[str, UserModel]) -> None:
    material_service = MaterialModel(
        name="Стандарты обслуживания",
        category="service",
        description="Базовые правила коммуникации с гостем",
        text="Приветствие, выявление потребности, рекомендация и завершение контакта.",
    )
    material_register = MaterialModel(
        name="Работа с кассой",
        category="operations",
        description="Кассовая дисциплина",
        text="Открытие смены, пробитие заказа, возвраты и закрытие смены.",
    )
    material_hygiene = MaterialModel(
        name="Личная гигиена сотрудника",
        category="hygiene",
        description="Требования к внешнему виду и санитарным нормам",
        text="Чистая форма, аккуратный внешний вид, соблюдение санитарных правил и чек-листов открытия.",
    )
    material_guest_recovery = MaterialModel(
        name="Работа с возражениями",
        category="service",
        description="Сценарии восстановления сервиса",
        text="Выслушать гостя, извиниться, предложить решение и закрыть ситуацию по стандарту сети.",
    )
    final_test = TestModel(
        name="Итоговый тест продавца",
        category="service",
        description="Проверка базовых знаний продавца",
        is_final=True,
        time_limit_minutes=20,
        pass_score_percent=70,
    )
    hygiene_test = TestModel(
        name="Проверка по гигиене",
        category="hygiene",
        description="Короткий тест по санитарным требованиям",
        is_final=True,
        time_limit_minutes=10,
        pass_score_percent=70,
    )
    task_greeting = TestTaskModel(
        name="Приветствие гостя",
        description="Какой первый шаг в стандарте обслуживания?",
        points=5,
        answer_variants=["Сразу предложить десерт", "Поздороваться и установить контакт", "Попросить оплатить заказ"],
        correct_variant=1,
    )
    task_register = TestTaskModel(
        name="Работа с кассой",
        description="Что нужно сделать в начале смены на кассе?",
        points=5,
        answer_variants=["Сразу пробить первый заказ", "Открыть смену и проверить кассу", "Сделать возврат"],
        correct_variant=1,
    )
    task_hands = TestTaskModel(
        name="Гигиена рук",
        description="Когда сотрудник обязан обработать руки?",
        points=5,
        answer_variants=["Только в начале смены", "Перед работой и после контакта с потенциально загрязненными поверхностями", "Только после обеда"],
        correct_variant=1,
    )
    task_uniform = TestTaskModel(
        name="Форма сотрудника",
        description="Какой вариант соответствует стандарту формы?",
        points=5,
        answer_variants=["Любая удобная одежда", "Чистая форма по стандарту и бейдж", "Только фартук"],
        correct_variant=1,
    )
    onboarding_course = CourseModel(
        name="Онбординг продавца",
        description="Демо-курс для новых сотрудников",
        rating_points=10,
        mrp=5,
    )
    hygiene_course = CourseModel(
        name="Гигиена и стандарты смены",
        description="Обязательный курс по санитарным нормам и поведению на точке",
        rating_points=10,
        mrp=4,
    )

    session.add_all(
        [
            material_service,
            material_register,
            material_hygiene,
            material_guest_recovery,
            final_test,
            hygiene_test,
            task_greeting,
            task_register,
            task_hands,
            task_uniform,
            onboarding_course,
            hygiene_course,
        ]
    )
    await session.flush()

    onboarding_done = _completed_at(10)
    hygiene_done = _completed_at(12)

    session.add_all(
        [
            TestTaskAssignmentModel(test_id=final_test.id, task_id=task_greeting.id, order=0),
            TestTaskAssignmentModel(test_id=final_test.id, task_id=task_register.id, order=1),
            TestTaskAssignmentModel(test_id=hygiene_test.id, task_id=task_hands.id, order=0),
            TestTaskAssignmentModel(test_id=hygiene_test.id, task_id=task_uniform.id, order=1),
            CourseMaterialModel(course_id=onboarding_course.id, material_id=material_service.id),
            CourseMaterialModel(course_id=onboarding_course.id, material_id=material_register.id),
            CourseTestModel(course_id=onboarding_course.id, test_id=final_test.id, is_final=True),
            CourseMaterialModel(course_id=hygiene_course.id, material_id=material_hygiene.id),
            CourseMaterialModel(course_id=hygiene_course.id, material_id=material_guest_recovery.id),
            CourseTestModel(course_id=hygiene_course.id, test_id=hygiene_test.id, is_final=True),
            CourseUserModel(user_id=users["seller_anna"].id, course_id=onboarding_course.id, user_points_by_course=0),
            CourseUserModel(
                user_id=users["seller_kirill"].id,
                course_id=onboarding_course.id,
                user_points_by_course=10,
                is_course_completed=True,
                is_course_completed_successfully=True,
            ),
            CourseUserModel(user_id=users["seller_olga"].id, course_id=onboarding_course.id, user_points_by_course=5),
            CourseUserModel(
                user_id=users["seller_maria"].id,
                course_id=onboarding_course.id,
                user_points_by_course=10,
                is_course_completed=True,
                is_course_completed_successfully=True,
            ),
            CourseUserModel(
                user_id=users["seller_ivan"].id,
                course_id=onboarding_course.id,
                user_points_by_course=10,
                is_course_completed=True,
                is_course_completed_successfully=True,
            ),
            CourseUserModel(
                user_id=users["seller_kirill"].id,
                course_id=hygiene_course.id,
                user_points_by_course=10,
                is_course_completed=True,
                is_course_completed_successfully=True,
            ),
            CourseUserModel(
                user_id=users["seller_denis"].id,
                course_id=hygiene_course.id,
                user_points_by_course=10,
                is_course_completed=True,
                is_course_completed_successfully=True,
            ),
            CourseUserModel(
                user_id=users["seller_svetlana"].id,
                course_id=hygiene_course.id,
                user_points_by_course=0,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_anna"].id,
                course_id=onboarding_course.id,
                material_id=material_service.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_kirill"].id,
                course_id=onboarding_course.id,
                material_id=material_service.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_kirill"].id,
                course_id=onboarding_course.id,
                material_id=material_register.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_olga"].id,
                course_id=onboarding_course.id,
                material_id=material_service.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_olga"].id,
                course_id=onboarding_course.id,
                material_id=material_register.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_maria"].id,
                course_id=onboarding_course.id,
                material_id=material_service.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_maria"].id,
                course_id=onboarding_course.id,
                material_id=material_register.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_ivan"].id,
                course_id=onboarding_course.id,
                material_id=material_service.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_ivan"].id,
                course_id=onboarding_course.id,
                material_id=material_register.id,
                is_completed=True,
                completed_at=onboarding_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_kirill"].id,
                course_id=hygiene_course.id,
                material_id=material_hygiene.id,
                is_completed=True,
                completed_at=hygiene_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_kirill"].id,
                course_id=hygiene_course.id,
                material_id=material_guest_recovery.id,
                is_completed=True,
                completed_at=hygiene_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_denis"].id,
                course_id=hygiene_course.id,
                material_id=material_hygiene.id,
                is_completed=True,
                completed_at=hygiene_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_denis"].id,
                course_id=hygiene_course.id,
                material_id=material_guest_recovery.id,
                is_completed=True,
                completed_at=hygiene_done,
            ),
            UserCourseMaterialModel(
                user_id=users["seller_svetlana"].id,
                course_id=hygiene_course.id,
                material_id=material_hygiene.id,
                is_completed=True,
                completed_at=hygiene_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_kirill"].id,
                course_id=onboarding_course.id,
                test_id=final_test.id,
                attempt_number=1,
                score=10,
                max_score=10,
                is_passed=True,
                answers={
                    str(task_greeting.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_register.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                },
                started_at=onboarding_done,
                completed_at=onboarding_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_olga"].id,
                course_id=onboarding_course.id,
                test_id=final_test.id,
                attempt_number=1,
                score=5,
                max_score=10,
                is_passed=False,
                answers={
                    str(task_greeting.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_register.id): {"selected_variant": 0, "is_correct": False, "points_earned": 0},
                },
                started_at=onboarding_done,
                completed_at=onboarding_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_maria"].id,
                course_id=onboarding_course.id,
                test_id=final_test.id,
                attempt_number=1,
                score=10,
                max_score=10,
                is_passed=True,
                answers={
                    str(task_greeting.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_register.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                },
                started_at=onboarding_done,
                completed_at=onboarding_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_ivan"].id,
                course_id=onboarding_course.id,
                test_id=final_test.id,
                attempt_number=1,
                score=10,
                max_score=10,
                is_passed=True,
                answers={
                    str(task_greeting.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_register.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                },
                started_at=onboarding_done,
                completed_at=onboarding_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_kirill"].id,
                course_id=hygiene_course.id,
                test_id=hygiene_test.id,
                attempt_number=1,
                score=10,
                max_score=10,
                is_passed=True,
                answers={
                    str(task_hands.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_uniform.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                },
                started_at=hygiene_done,
                completed_at=hygiene_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_denis"].id,
                course_id=hygiene_course.id,
                test_id=hygiene_test.id,
                attempt_number=1,
                score=10,
                max_score=10,
                is_passed=True,
                answers={
                    str(task_hands.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                    str(task_uniform.id): {"selected_variant": 1, "is_correct": True, "points_earned": 5},
                },
                started_at=hygiene_done,
                completed_at=hygiene_done,
            ),
            UserCourseTestModel(
                user_id=users["seller_svetlana"].id,
                course_id=hygiene_course.id,
                test_id=hygiene_test.id,
                attempt_number=1,
                score=0,
                max_score=10,
                is_passed=False,
                answers={
                    str(task_hands.id): {"selected_variant": 0, "is_correct": False, "points_earned": 0},
                    str(task_uniform.id): {"selected_variant": 2, "is_correct": False, "points_earned": 0},
                },
                started_at=hygiene_done,
                completed_at=hygiene_done,
            ),
        ]
    )


async def seed_demo1(session: AsyncSession) -> None:
    """Seed only Demo 1 scope: auth users, structure, compensation, timesheets."""
    password, accounts = _load_demo_accounts()
    await _reset_database(session)
    users = await _seed_users(session, password, accounts)
    await _seed_locations(session, users)
    await _seed_personnel(session, users)
    await session.commit()
    logger.info("Demo 1 dataset seeded (users, structure, personnel). Knowledge/sales skipped.")
    _log_demo_credentials(password, accounts)


async def seed_demo(session: AsyncSession) -> None:
    password, accounts = _load_demo_accounts()
    await _reset_database(session)
    users = await _seed_users(session, password, accounts)
    await _seed_locations(session, users)
    await _seed_personnel(session, users)
    await _seed_knowledge_base(session, users)
    await session.commit()
    _log_demo_credentials(password, accounts)


_DEMO1_SEED_ENVIRONMENTS = frozenset({"demo", "docker", "development"})


def _load_demo1_settings() -> Settings:
    settings = load_settings(_config_path())
    if settings.env_mode not in _DEMO1_SEED_ENVIRONMENTS:
        raise RuntimeError(
            f"Refusing to reset database: config environment is {settings.env_mode!r}, "
            f"expected one of {sorted(_DEMO1_SEED_ENVIRONMENTS)}."
        )
    return settings


async def main_demo1() -> None:
    settings = _load_demo1_settings()
    db_url = _normalize_db_url(os.getenv("DATABASE_URL") or settings.database.url)
    engine = create_async_engine(db_url)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as session:
            await seed_demo1(session)
    finally:
        await engine.dispose()


async def main() -> None:
    settings = _load_demo_settings()
    db_url = _normalize_db_url(os.getenv("DATABASE_URL") or settings.database.url)
    engine = create_async_engine(db_url)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as session:
            await seed_demo(session)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

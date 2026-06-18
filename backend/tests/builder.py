from datetime import date, datetime
from decimal import Decimal
from typing import Any, Self
from uuid import UUID, uuid4

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseModel,
    CourseTestModel,
    CourseUserModel,
    MaterialAttachmentModel,
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
    EmployeeCompensationModel,
    EmployeeTimeEntryModel,
    ShiftType,
)
from app.users.db_models import UserModel, UserRole


class Builder:
    def __init__(self, session: AsyncSession, default_datetime: datetime) -> None:
        self._session = session
        self._default_datetime = default_datetime

        self.__user: UserModel | None = None
        self.__seller: UserModel | None = None
        self.__manager: UserModel | None = None
        self.__admin_staff: UserModel | None = None
        self.__location: LocationModel | None = None
        self.__block: BlockModel | None = None
        self.__activity_code: ActivityCodeModel | None = None

    @property
    async def default_user(self) -> UserModel:
        if self.__user is None:
            self.__user = await self.build_user()
        return self.__user

    @property
    async def default_location(self) -> LocationModel:
        if self.__location is None:
            self.__location = await self.build_location(
                code="MAIN001",
                name="Main Office",
                address="123 Main Street, Moscow",
            )
        return self.__location

    @property
    async def default_block(self) -> BlockModel:
        if self.__block is None:
            self.__block = await self.build_block(name="Default Block")
        return self.__block

    @property
    async def default_seller(self) -> UserModel:
        if self.__seller is None:
            self.__seller = await self.build_user(
                external_system_id="default_seller",
                role=UserRole.SELLER,
            )
        return self.__seller

    @property
    async def default_manager(self) -> UserModel:
        if self.__manager is None:
            manager, _, _ = await self.build_manager_with_block(
                user_kwargs={
                    "external_system_id": "default_manager",
                    "first_name": "Default",
                    "last_name": "Manager",
                    "role": UserRole.MANAGER,
                },
            )
            self.__manager = manager
        return self.__manager

    @property
    async def default_admin_staff(self) -> UserModel:
        if self.__admin_staff is None:
            self.__admin_staff = await self.build_user(
                external_system_id="default_admin_staff",
                role=UserRole.ADMIN_STAFF,
                first_name="Admin",
                last_name="Staff",
            )
        return self.__admin_staff

    @property
    async def default_activity_code(self) -> ActivityCodeModel:
        if self.__activity_code is None:
            self.__activity_code = await self.build_activity_code()
        return self.__activity_code

    def auth_context_for(self, user: UserModel) -> AuthContext:
        role = user.role.value if isinstance(user.role, UserRole) else str(user.role)
        return AuthContext(user_id=str(user.id), role=role)

    def with_user(self, user: UserModel) -> Self:
        self.__user = user
        return self

    def with_location(self, location: LocationModel) -> Self:
        self.__location = location
        return self

    def with_block(self, block: BlockModel) -> Self:
        self.__block = block
        return self

    async def build_user(
        self,
        *,
        user_id: UUID | None = None,
        external_system_id: str = "test_user_001",
        hashed_password: str = "hashed_password_123",
        role: UserRole = UserRole.SELLER,
        first_name: str | None = "John",
        last_name: str | None = "Doe",
        phone: str | None = "+7-999-123-45-67",
        position: str | None = "Sales Manager",
        birth_date: date | None = None,
        avatar_url: str | None = "https://example.com/avatar.jpg",
        is_active: bool = True,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> UserModel:
        statement = (
            insert(UserModel)
            .values(
                id=user_id or uuid4(),
                external_system_id=external_system_id,
                hashed_password=hashed_password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                position=position,
                birth_date=birth_date,
                avatar_url=avatar_url,
                is_active=is_active,
                created_at=created_at or self._default_datetime,
                updated_at=updated_at or self._default_datetime,
            )
            .returning(UserModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_location(
        self,
        *,
        location_id: int | None = None,
        code: str = "LOC001",
        name: str = "Test Location",
        address: str = "Test Address 123",
        city: str | None = "Moscow",
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> LocationModel:
        values = {
            "code": code,
            "name": name,
            "address": address,
            "city": city,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if location_id is not None:
            values["id"] = location_id
        statement = insert(LocationModel).values(**values).returning(LocationModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_block(
        self,
        *,
        block_id: int | None = None,
        name: str = "Test Block",
        description: str | None = "Test block description",
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> BlockModel:
        values = {
            "name": name,
            "description": description,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if block_id is not None:
            values["id"] = block_id
        statement = insert(BlockModel).values(**values).returning(BlockModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_activity_code(
        self,
        *,
        code: str = "Я",
        name: str = "Явка",
        entry_type: str = "work",
        default_hours: Decimal | None = Decimal("8.00"),
        is_paid: bool = True,
        is_worked_time: bool = True,
    ) -> ActivityCodeModel:
        statement = (
            insert(ActivityCodeModel)
            .values(
                code=code,
                name=name,
                entry_type=entry_type,
                default_hours=default_hours,
                is_paid=is_paid,
                is_worked_time=is_worked_time,
            )
            .returning(ActivityCodeModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_employee_compensation(
        self,
        *,
        user: UserModel | None = None,
        base_salary: Decimal = Decimal("50000.00"),
        hourly_rate: Decimal = Decimal("300.00"),
        night_hourly_rate: Decimal | None = None,
        updated_at: datetime | None = None,
    ) -> EmployeeCompensationModel:
        user_obj = user or await self.default_seller
        statement = (
            insert(EmployeeCompensationModel)
            .values(
                user_id=user_obj.id,
                base_salary=base_salary,
                hourly_rate=hourly_rate,
                night_hourly_rate=night_hourly_rate,
                updated_at=updated_at or self._default_datetime,
            )
            .returning(EmployeeCompensationModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_time_entry(
        self,
        *,
        user: UserModel | None = None,
        work_date: date | None = None,
        activity_code: str | None = None,
        hours: Decimal = Decimal("8.00"),
        shift_type: str = ShiftType.DAY.value,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> EmployeeTimeEntryModel:
        user_obj = user or await self.default_seller
        code_obj = await self.default_activity_code
        code = activity_code or code_obj.code
        statement = (
            insert(EmployeeTimeEntryModel)
            .values(
                user_id=user_obj.id,
                work_date=work_date or self._default_datetime.date(),
                activity_code=code,
                hours=hours,
                shift_type=shift_type,
                created_at=created_at or self._default_datetime,
                updated_at=updated_at or self._default_datetime,
            )
            .returning(EmployeeTimeEntryModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_block_member(
        self,
        *,
        user: UserModel | None = None,
        block: BlockModel | None = None,
        status: str = BlockMemberStatus.PRIMARY.value,
        assigned_at: datetime | None = None,
    ) -> BlockMemberModel:
        user_obj = user or await self.default_user
        block_obj = block or await self.default_block

        statement = (
            insert(BlockMemberModel)
            .values(
                user_id=user_obj.id,
                block_id=block_obj.id,
                status=status,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(BlockMemberModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_manager_block(
        self,
        *,
        manager: UserModel | None = None,
        block: BlockModel | None = None,
        assigned_at: datetime | None = None,
    ) -> ManagerBlockModel:
        manager_obj = manager or await self.default_user
        block_obj = block or await self.default_block

        statement = (
            insert(ManagerBlockModel)
            .values(
                manager_id=manager_obj.id,
                block_id=block_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(ManagerBlockModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_user_location(
        self,
        *,
        user: UserModel | None = None,
        location: LocationModel | None = None,
        assigned_at: datetime | None = None,
    ) -> UserLocationModel:
        user_obj = user or await self.default_user
        location_obj = location or await self.default_location

        statement = (
            insert(UserLocationModel)
            .values(
                user_id=user_obj.id,
                location_id=location_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(UserLocationModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_block_location(
        self,
        *,
        block: BlockModel | None = None,
        location: LocationModel | None = None,
        assigned_at: datetime | None = None,
    ) -> BlockLocationModel:
        block_obj = block or await self.default_block
        location_obj = location or await self.default_location

        statement = (
            insert(BlockLocationModel)
            .values(
                block_id=block_obj.id,
                location_id=location_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(BlockLocationModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_manager_with_block(
        self,
        *,
        user_kwargs: dict[str, Any] | None = None,
        block_kwargs: dict[str, Any] | None = None,
    ) -> tuple[UserModel, BlockModel, ManagerBlockModel]:
        merged_kwargs = {"role": UserRole.MANAGER}
        if user_kwargs:
            merged_kwargs.update(user_kwargs)
        user = await self.build_user(**merged_kwargs)
        block = await self.build_block(**block_kwargs) if block_kwargs else await self.default_block
        assignment = await self.build_manager_block(manager=user, block=block)
        return user, block, assignment

    async def build_user_with_location(
        self,
        *,
        user_kwargs: dict[str, Any] | None = None,
        location_kwargs: dict[str, Any] | None = None,
    ) -> tuple[UserModel, LocationModel, UserLocationModel]:
        user = await self.build_user(**(user_kwargs or {}))
        location = await self.build_location(**(location_kwargs or {}))
        assignment = await self.build_user_location(user=user, location=location)
        return user, location, assignment

    async def build_course(
        self,
        *,
        course_id: int | None = None,
        name: str = "Test Course",
        description: str | None = "Test course description",
        rating_points: int = 100,
        mrp: int = 80,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> CourseModel:
        values = {
            "name": name,
            "description": description,
            "rating_points": rating_points,
            "mrp": mrp,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if course_id is not None:
            values["id"] = course_id
        statement = insert(CourseModel).values(**values).returning(CourseModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_material(
        self,
        *,
        material_id: int | None = None,
        name: str = "Test Material",
        category: str = "general",
        description: str | None = "Test material description",
        text: str = "Material content text",
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> MaterialModel:
        values = {
            "name": name,
            "category": category,
            "description": description,
            "text": text,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if material_id is not None:
            values["id"] = material_id
        statement = insert(MaterialModel).values(**values).returning(MaterialModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_test(
        self,
        *,
        test_id: int | None = None,
        name: str = "Test Quiz",
        category: str = "general",
        description: str | None = "Test quiz description",
        is_final: bool = False,
        pass_score_percent: int = 70,
        time_limit_minutes: int | None = None,
        max_attempts: int | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> TestModel:
        values = {
            "name": name,
            "category": category,
            "description": description,
            "is_final": is_final,
            "pass_score_percent": pass_score_percent,
            "time_limit_minutes": time_limit_minutes,
            "max_attempts": max_attempts,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if test_id is not None:
            values["id"] = test_id
        statement = insert(TestModel).values(**values).returning(TestModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_test_task(
        self,
        *,
        task_id: int | None = None,
        name: str = "Test Task",
        description: str | None = "Test task description",
        points: int = 10,
        answer_variants: list | None = None,
        correct_variant: int = 0,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> TestTaskModel:
        values = {
            "name": name,
            "description": description,
            "points": points,
            "answer_variants": answer_variants or ["Option A", "Option B", "Option C"],
            "correct_variant": correct_variant,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if task_id is not None:
            values["id"] = task_id
        statement = insert(TestTaskModel).values(**values).returning(TestTaskModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_course_material(
        self,
        *,
        course: CourseModel | None = None,
        material: MaterialModel | None = None,
        created_at: datetime | None = None,
    ) -> CourseMaterialModel:
        course_obj = course or await self.build_course()
        material_obj = material or await self.build_material()
        statement = (
            insert(CourseMaterialModel)
            .values(
                course_id=course_obj.id,
                material_id=material_obj.id,
                created_at=created_at or self._default_datetime,
                updated_at=created_at or self._default_datetime,
            )
            .returning(CourseMaterialModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_course_test(
        self,
        *,
        course: CourseModel | None = None,
        test: TestModel | None = None,
        is_final: bool = False,
        created_at: datetime | None = None,
    ) -> CourseTestModel:
        course_obj = course or await self.build_course()
        test_obj = test or await self.build_test()
        statement = (
            insert(CourseTestModel)
            .values(
                course_id=course_obj.id,
                test_id=test_obj.id,
                is_final=is_final,
                created_at=created_at or self._default_datetime,
                updated_at=created_at or self._default_datetime,
            )
            .returning(CourseTestModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_course_user(
        self,
        *,
        user: UserModel | None = None,
        course: CourseModel | None = None,
        user_points_by_course: int = 0,
        is_course_completed: bool = False,
        is_course_completed_successfully: bool = False,
        created_at: datetime | None = None,
    ) -> CourseUserModel:
        user_obj = user or await self.build_user()
        course_obj = course or await self.build_course()
        statement = (
            insert(CourseUserModel)
            .values(
                user_id=user_obj.id,
                course_id=course_obj.id,
                user_points_by_course=user_points_by_course,
                is_course_completed=is_course_completed,
                is_course_completed_successfully=is_course_completed_successfully,
                created_at=created_at or self._default_datetime,
                updated_at=created_at or self._default_datetime,
            )
            .returning(CourseUserModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_user_course_material(
        self,
        *,
        user: UserModel | None = None,
        course: CourseModel | None = None,
        material: MaterialModel | None = None,
        is_completed: bool = True,
        created_at: datetime | None = None,
    ) -> UserCourseMaterialModel:
        user_obj = user or await self.build_user()
        course_obj = course or await self.build_course()
        material_obj = material or await self.build_material()
        statement = (
            insert(UserCourseMaterialModel)
            .values(
                user_id=user_obj.id,
                course_id=course_obj.id,
                material_id=material_obj.id,
                is_completed=is_completed,
                completed_at=created_at or self._default_datetime if is_completed else None,
                created_at=created_at or self._default_datetime,
                updated_at=created_at or self._default_datetime,
            )
            .returning(UserCourseMaterialModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_user_course_test(
        self,
        *,
        user: UserModel | None = None,
        course: CourseModel | None = None,
        test: TestModel | None = None,
        score: int = 0,
        max_score: int = 100,
        is_passed: bool = False,
        answers: dict | None = None,
        created_at: datetime | None = None,
    ) -> UserCourseTestModel:
        user_obj = user or await self.build_user()
        course_obj = course or await self.build_course()
        test_obj = test or await self.build_test()
        statement = (
            insert(UserCourseTestModel)
            .values(
                user_id=user_obj.id,
                course_id=course_obj.id,
                test_id=test_obj.id,
                score=score,
                max_score=max_score,
                is_passed=is_passed,
                answers=answers or {},
                created_at=created_at or self._default_datetime,
                updated_at=created_at or self._default_datetime,
            )
            .returning(UserCourseTestModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_test_task_assignment(
        self,
        *,
        test: TestModel | None = None,
        task: TestTaskModel | None = None,
        order: int = 0,
        created_at: datetime | None = None,
    ) -> TestTaskAssignmentModel:
        test_obj = test or await self.build_test()
        task_obj = task or await self.build_test_task()
        statement = (
            insert(TestTaskAssignmentModel)
            .values(
                test_id=test_obj.id,
                task_id=task_obj.id,
                order=order,
                created_at=created_at or self._default_datetime,
            )
            .returning(TestTaskAssignmentModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_material_attachment(
        self,
        *,
        material: MaterialModel | None = None,
        name: str = "attachment",
        format: str = "pdf",
        s3_file_key: str | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> MaterialAttachmentModel:
        material_obj = material or await self.build_material()
        key = s3_file_key or MaterialAttachmentModel.generate_s3_key(material_obj.id, name, format)
        statement = (
            insert(MaterialAttachmentModel)
            .values(
                material_id=material_obj.id,
                name=name,
                format=format,
                s3_file_key=key,
                created_at=created_at or self._default_datetime,
                updated_at=updated_at or self._default_datetime,
            )
            .returning(MaterialAttachmentModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_course_with_materials(
        self,
        *,
        course_kwargs: dict[str, Any] | None = None,
        material_count: int = 2,
    ) -> tuple[CourseModel, list[MaterialModel], list[CourseMaterialModel]]:
        course = await self.build_course(**(course_kwargs or {}))
        materials = []
        assignments = []
        for i in range(material_count):
            material = await self.build_material(name=f"Material {i + 1}")
            assignment = await self.build_course_material(course=course, material=material)
            materials.append(material)
            assignments.append(assignment)
        return course, materials, assignments

    async def build_course_with_test(
        self,
        *,
        course_kwargs: dict[str, Any] | None = None,
        test_kwargs: dict[str, Any] | None = None,
        task_count: int = 3,
        is_final: bool = False,
    ) -> tuple[CourseModel, TestModel, list[TestTaskModel], CourseTestModel]:
        course = await self.build_course(**(course_kwargs or {}))
        test = await self.build_test(**(test_kwargs or {}))
        tasks = []
        for i in range(task_count):
            task = await self.build_test_task(
                name=f"Task {i + 1}",
                points=10,
                correct_variant=0,
            )
            await self.build_test_task_assignment(test=test, task=task, order=i)
            tasks.append(task)
        course_test = await self.build_course_test(course=course, test=test, is_final=is_final)
        return course, test, tasks, course_test

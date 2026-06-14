from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserRole
from app.users.dto import UserDTO, UsersListDTO
from app.users.usecases.list_users_usecase import ListUsersUseCase
from tests.builder import Builder


class TestListUsersUseCase:
    async def test_returns_all_users_ordered_by_created_at_desc(
        self,
        db_session: AsyncSession,
        builder: Builder,
        frozen_datetime: datetime,
    ) -> None:
        older = await builder.build_user(
            external_system_id="list_user_older",
            first_name="Older",
            created_at=frozen_datetime - timedelta(days=2),
            updated_at=frozen_datetime - timedelta(days=2),
        )
        newer = await builder.build_user(
            external_system_id="list_user_newer",
            first_name="Newer",
            created_at=frozen_datetime,
            updated_at=frozen_datetime,
        )

        result = await ListUsersUseCase(db_session).execute()

        assert isinstance(result, UsersListDTO)
        assert result.total == 2
        assert len(result.items) == 2
        assert result.items[0].id == newer.id
        assert result.items[1].id == older.id

    async def test_filters_by_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        await builder.build_user(
            external_system_id="list_seller",
            role=UserRole.SELLER,
        )
        manager = await builder.build_user(
            external_system_id="list_manager",
            role=UserRole.MANAGER,
        )

        result = await ListUsersUseCase(db_session).execute(role=UserRole.MANAGER)

        assert result.total == 1
        assert result.items[0].id == manager.id
        assert result.items[0].role == "manager"

    async def test_filters_by_is_active(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        await builder.build_user(
            external_system_id="list_active",
            is_active=True,
        )
        inactive = await builder.build_user(
            external_system_id="list_inactive",
            is_active=False,
        )

        result = await ListUsersUseCase(db_session).execute(is_active=False)

        assert result.total == 1
        assert result.items[0].id == inactive.id
        assert result.items[0].is_active is False

    async def test_filters_by_block_id(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        block_a = await builder.build_block(name="Block A")
        block_b = await builder.build_block(name="Block B")
        member = await builder.build_user(
            external_system_id="list_block_member",
            first_name="Member",
        )
        other = await builder.build_user(
            external_system_id="list_other_user",
            first_name="Other",
        )
        await builder.build_block_member(user=member, block=block_a)
        await builder.build_block_member(user=other, block=block_b)

        result = await ListUsersUseCase(db_session).execute(block_id=block_a.id)

        assert result.total == 1
        assert result.items[0].id == member.id

    async def test_filters_by_location_id(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user, location, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "list_loc_user"},
            location_kwargs={"code": "LOC_A", "name": "Office A"},
        )
        await builder.build_user(external_system_id="list_no_location")

        result = await ListUsersUseCase(db_session).execute(location_id=location.id)

        assert result.total == 1
        assert result.items[0].id == user.id
        assert result.items[0].location is not None
        assert result.items[0].location.name == "Office A"

    async def test_returns_user_with_location_and_managed_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager, block, _ = await builder.build_manager_with_block(
            user_kwargs={
                "external_system_id": "list_manager_full",
                "first_name": "Bob",
                "last_name": "Manager",
                "role": UserRole.MANAGER,
            },
            block_kwargs={"name": "Sales Block"},
        )
        location = await builder.build_location(code="LOC_M", name="Manager Office")
        await builder.build_user_location(user=manager, location=location)

        result = await ListUsersUseCase(db_session).execute()

        manager_dto = next(item for item in result.items if item.id == manager.id)
        assert isinstance(manager_dto, UserDTO)
        assert manager_dto.managed_block is not None
        assert manager_dto.managed_block.id == block.id
        assert manager_dto.managed_block.name == "Sales Block"
        assert manager_dto.location is not None
        assert manager_dto.location.name == "Manager Office"

from app.users.db_models import UserRole

KB_CONTENT_VIEW_ALL_ROLES = frozenset(
    {
        UserRole.SUPER_ADMIN.value,
        UserRole.ROOT_ADMIN.value,
        UserRole.ADMIN_EDUCATION.value,
        UserRole.MANAGER.value,
    }
)

KB_PROGRESSION_ROLES = frozenset({UserRole.SELLER.value})

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import CourseUserModel, UserCourseTestModel


async def recalculate_course_user_points(
    session: AsyncSession,
    *,
    course_id: int,
    user_id,
) -> CourseUserModel | None:
    enrollment = (
        await session.execute(
            select(CourseUserModel).where(
                CourseUserModel.course_id == course_id,
                CourseUserModel.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        return None

    total_score_result = await session.execute(
        select(func.coalesce(func.sum(UserCourseTestModel.score), 0)).where(
            UserCourseTestModel.course_id == course_id,
            UserCourseTestModel.user_id == user_id,
            UserCourseTestModel.completed_at.is_not(None),
        )
    )
    enrollment.user_points_by_course = int(total_score_result.scalar_one() or 0)
    return enrollment

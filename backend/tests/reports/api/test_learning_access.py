from httpx import AsyncClient
from datetime import datetime

from app.users.db_models import UserRole
from tests.builder import Builder


class TestLearningReportsAccess:
    async def test_education_admin_can_recalculate_and_read_learning_rating(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        education_admin = await builder.build_user(
            external_system_id="edu_rating_admin",
            role=UserRole.ADMIN_EDUCATION,
        )
        seller = await builder.default_seller
        course = await builder.build_course(rating_points=100)
        test = await builder.build_test()
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=75,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 1, 15, 10, 0, 0),
        )

        recalc_response = await client.post(
            "/api/v1/ratings/recalculate?period_from=2024-01-01&period_to=2024-01-31",
            headers=bearer_headers(education_admin),
        )

        assert recalc_response.status_code == 200

        rating_response = await client.get(
            "/api/v1/ratings/learning?period_from=2024-01-01&period_to=2024-01-31",
            headers=bearer_headers(education_admin),
        )

        assert rating_response.status_code == 200
        body = rating_response.json()
        assert body["items"][0]["total_points"] == 75.0

    async def test_education_admin_can_open_learning_report(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        education_admin = await builder.build_user(
            external_system_id="edu_learning_report",
            role=UserRole.ADMIN_EDUCATION,
        )
        seller = await builder.default_seller
        course = await builder.build_course(rating_points=100)
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=40,
        )

        response = await client.get(
            "/api/v1/reports/learning",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 200

from datetime import date, timedelta
from typing import Annotated, Optional

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.deps import (
    AuthContext,
    require_learning_rating_admin,
    require_learning_report_viewer,
)
from app.reports.usecases.calculate_learning_rating_usecase import CalculateLearningRatingUseCase
from app.reports.usecases.get_learning_rating_usecase import GetLearningRatingUseCase, LearningRatingDTO

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/learning",
    response_model=LearningRatingDTO,
    summary="Рейтинг обучения (последний снапшот)",
)
async def get_learning_rating(
    auth: Annotated[AuthContext, Depends(require_learning_report_viewer)],
    usecase: FromDishka[GetLearningRatingUseCase],
    scope_type: str = Query(default="network", pattern="^(network|block|location)$"),
    scope_id: Optional[int] = Query(default=None),
    period_from: Optional[date] = Query(default=None),
    period_to: Optional[date] = Query(default=None),
) -> LearningRatingDTO:
    result = await usecase.execute(
        scope_type=scope_type,
        scope_id=scope_id,
        period_from=period_from,
        period_to=period_to,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Рейтинг ещё не сформирован")
    return result


@router.post(
    "/recalculate",
    response_model=dict,
    summary="Пересчитать рейтинг обучения (Admin ПО)",
)
async def recalculate_learning_rating(
    auth: Annotated[AuthContext, Depends(require_learning_rating_admin)],
    usecase: FromDishka[CalculateLearningRatingUseCase],
    period_from: Optional[date] = Query(default=None),
    period_to: Optional[date] = Query(default=None),
) -> dict:
    today = date.today()
    pf = period_from or date(today.year, today.month, 1)
    pt = period_to or today
    snapshot = await usecase.execute(period_from=pf, period_to=pt)
    return {"snapshot_id": snapshot.id, "calculated_at": snapshot.calculated_at.isoformat()}

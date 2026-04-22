from fastapi import APIRouter, HTTPException, status
from dishka.integrations.fastapi import FromDishka

from app.auth.deps import AuthContext
from app.knowledge_base.domain import StartTestRequest, SubmitAnswerRequest, UserContext
from app.knowledge_base.dto import (
    TestDTO,
    StartTestResultDTO,
    SubmitAnswerResultDTO,
    TestResultDTO,
)
from app.knowledge_base.usecases.tests.get_test_usecase import GetTestByIdUseCase
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.knowledge_base.usecases.tests.submit_answer_usecase import SubmitAnswerUseCase
from app.knowledge_base.usecases.tests.get_test_result_usecase import GetTestResultUseCase
from app.users.db_models import UserRole

router = APIRouter()


@router.get(
    "/{test_id}",
    response_model=TestDTO,
    summary="Получить тест по ID",
    description="Возвращает тест с задачами в контексте курса",
)
async def get_test_by_id(
    test_id: int,
    course_id: int,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: GetTestByIdUseCase = FromDishka[GetTestByIdUseCase],
) -> TestDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    test = await usecase.execute(
        test_id=test_id,
        course_id=course_id,
        ctx=ctx,
    )

    if test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Test with id={test_id} not found or access denied",
        )

    return test


@router.post(
    "/start",
    response_model=StartTestResultDTO,
    summary="Начать прохождение теста",
    description="Начинает тест и возвращает первую задачу",
)
async def start_test(
    request: StartTestRequest,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: StartTestUseCase = FromDishka[StartTestUseCase],
) -> StartTestResultDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(
        request=request,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test not found or user not enrolled in course",
        )

    return result


@router.post(
    "/submit-answer",
    response_model=SubmitAnswerResultDTO,
    summary="Отправить ответ на задачу",
    description="Проверяет ответ, начисляет баллы, возвращает следующую задачу",
)
async def submit_answer(
    request: SubmitAnswerRequest,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: SubmitAnswerUseCase = FromDishka[SubmitAnswerUseCase],
) -> SubmitAnswerResultDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(
        request=request,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test, task, or course not found or access denied",
        )

    return result


@router.get(
    "/{test_id}/result",
    response_model=TestResultDTO,
    summary="Получить результат теста",
    description="Возвращает результаты прохождения теста",
)
async def get_test_result(
    test_id: int,
    course_id: int,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: GetTestResultUseCase = FromDishka[GetTestResultUseCase],
) -> TestResultDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(
        test_id=test_id,
        course_id=course_id,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found or access denied",
        )

    return result

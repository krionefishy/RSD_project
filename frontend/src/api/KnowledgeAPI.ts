import type {
  CompleteCourseResult,
  CompleteMaterialResult,
  Course,
  CourseListItem,
  CourseMaterialItem,
  CourseTestItem,
  Material,
  MaterialAttachment,
  MaterialAttachmentLink,
  StartTestResult,
  SubmitAnswerResult,
  Test,
  TestResult,
  TestTask,
  TestTaskAdmin,
} from "../types/knowledge";
import { apiClient } from "./APIClient";

export type { Course, CourseListItem } from "../types/knowledge";

function isMockKB(): boolean {
  return import.meta.env.VITE_MOCK_KB === "true";
}

// ============ MOCK DATA ============

const MOCK_COURSES_LIST: CourseListItem[] = [
  { id: 1, name: "Новый сотрудник: Базовый курс", description: "Обязательный курс для всех новых сотрудников", materialsCount: 5, testsCount: 2 },
  { id: 2, name: "Стандарты обслуживания", description: "Всё о работе с клиентами", materialsCount: 4, testsCount: 1 },
  { id: 3, name: "Ассортимент и продукция", description: "Изучение всего ассортимента", materialsCount: 6, testsCount: 2 },
];

const MOCK_COURSES: Record<number, Course> = {
  1: {
    id: 1,
    name: "Новый сотрудник: Базовый курс",
    description: "Обязательный курс для всех новых сотрудников. Основы работы на точке, санитарные нормы, работа с кассой.",
    ratingPoints: 100,
    mrp: 60,
    materialsCount: 5,
    testsCount: 2,
    createdAt: "2024-01-15T00:00:00Z",
    userPointsByCourse: 45,
    isCourseCompleted: false,
    materials: [
      { id: 1, materialId: 101, name: "Добро пожаловать в команду!", category: "Введение", description: "О компании и ценностях", isCompleted: true },
      { id: 2, materialId: 102, name: "Правила внутреннего распорядка", category: "Организация", description: "Регламент и график", isCompleted: true },
      { id: 3, materialId: 103, name: "Санитарные нормы и гигиена", category: "Безопасность", description: "Стандарты чистоты", isCompleted: false },
      { id: 4, materialId: 104, name: "Работа с кассой: основы", category: "Касса", description: "Базовые операции", isCompleted: false },
      { id: 5, materialId: 105, name: "Открытие и закрытие смены", category: "Процедуры", description: "Чек-листы", isCompleted: false },
    ],
    tests: [
      { id: 1, testId: 201, name: "Итоговый тест: Базовый курс", category: "Итоговый", isFinal: true, tasksCount: 20, isPassed: false, score: null },
      { id: 2, testId: 202, name: "Проверка знаний: Касса", category: "Промежуточный", isFinal: false, tasksCount: 10, isPassed: true, score: 85 },
    ],
  },
  2: {
    id: 2,
    name: "Стандарты обслуживания",
    description: "Всё о работе с клиентами: приветствие, допродажи, работа с претензиями.",
    ratingPoints: 80,
    mrp: 50,
    materialsCount: 4,
    testsCount: 1,
    createdAt: "2024-02-01T00:00:00Z",
    userPointsByCourse: 0,
    isCourseCompleted: false,
    materials: [
      { id: 6, materialId: 106, name: "Приветствие клиента", category: "Сервис", description: "Первое впечатление", isCompleted: false },
      { id: 7, materialId: 107, name: "Техника допродаж", category: "Продажи", description: "Upsell и cross-sell", isCompleted: false },
      { id: 8, materialId: 108, name: "Работа с претензиями", category: "Сервис", description: "По HEART", isCompleted: false },
      { id: 9, materialId: 109, name: "Лояльность клиентов", category: "Сервис", description: "Постоянные покупатели", isCompleted: false },
    ],
    tests: [
      { id: 3, testId: 203, name: "Тест: Стандарты обслуживания", category: "Итоговый", isFinal: true, tasksCount: 15, isPassed: false, score: null },
    ],
  },
  3: {
    id: 3,
    name: "Ассортимент и продукция",
    description: "Изучение всего ассортимента: хлеб, выпечка, торты, условия хранения.",
    ratingPoints: 120,
    mrp: 70,
    materialsCount: 6,
    testsCount: 2,
    createdAt: "2024-03-01T00:00:00Z",
    userPointsByCourse: 120,
    isCourseCompleted: true,
    materials: [
      { id: 10, materialId: 110, name: "Хлеб и хлебобулочные изделия", category: "Ассортимент", description: "Виды хлеба", isCompleted: true },
      { id: 11, materialId: 111, name: "Сдобная выпечка", category: "Ассортимент", description: "Круассаны, слойки", isCompleted: true },
      { id: 12, materialId: 112, name: "Торты и пирожные", category: "Ассортимент", description: "Кондитерка", isCompleted: true },
      { id: 13, materialId: 113, name: "Полуфабрикаты", category: "Ассортимент", description: "Пицца, пельмени", isCompleted: true },
      { id: 14, materialId: 114, name: "Условия хранения", category: "Хранение", description: "Температурные режимы", isCompleted: true },
      { id: 15, materialId: 115, name: "Сроки годности", category: "Хранение", description: "Маркировка", isCompleted: true },
    ],
    tests: [
      { id: 4, testId: 204, name: "Тест: Ассортимент", category: "Итоговый", isFinal: true, tasksCount: 25, isPassed: true, score: 92 },
      { id: 5, testId: 205, name: "Повторный тест: Хранение", category: "Повторный", isFinal: false, tasksCount: 12, isPassed: true, score: 88 },
    ],
  },
};

const MOCK_MATERIALS: Record<number, Material> = {
  101: {
    id: 101,
    name: "Добро пожаловать в команду!",
    category: "Введение",
    description: "О компании и ценностях",
    text: "## Добро пожаловать в Робин Сдобин!\n\nМы — сеть пекарен, где каждый день печём свежий хлеб и выпечку для наших клиентов.\n\n### Наши ценности:\n- **Свежесть** — всё печём сегодня\n- **Качество** — только натуральные ингредиенты\n- **Забота** — каждый клиент особенный\n\n### Твоя роль:\nТы — лицо нашей пекарни. Именно ты встречаешь клиентов и помогаешь им выбрать самое вкусное.",
    attachments: [],
    courseId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
  102: {
    id: 102,
    name: "Правила внутреннего распорядка",
    category: "Организация",
    description: "Регламент и график",
    text: "## Правила внутреннего распорядка\n\n### Рабочий график:\n- Смены: 8 часов с перерывом на обед\n- Приходить за 15 минут до смены\n- Опоздания — только с уважительной причины\n\n### Униформа:\n- Чистый фартук\n- Шапочка/бандана обязательно\n- Закрытая обувь без каблуков\n- Без длинных открытых волос",
    attachments: [{ id: 1, name: "Регламент_2024.pdf", format: "pdf" }],
    courseId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
  103: {
    id: 103,
    name: "Санитарные нормы и гигиена",
    category: "Безопасность",
    description: "Стандарты чистоты",
    text: "## Санитарные нормы\n\n### Личная гигиена:\n1. Мыть руки после туалета, перерыва, работы с мусором\n2. Дезинфекция каждые 2 часа\n3. Перчатки при работе с продуктами\n\n### Уборка рабочего места:\n- Каждые 2 часа протирать столы\n- Уборка в конце смены\n- Мыть посуду сразу после использования",
    attachments: [],
    courseId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
  104: {
    id: 104,
    name: "Работа с кассой: основы",
    category: "Касса",
    description: "Базовые операции",
    text: "## Работа с кассой\n\n### Открытие смены:\n1. Авторизуйтесь по карте\n2. Проверьте остаток в ящике\n3. Напечатайте X-отчёт\n\n### Оформление заказа:\n1. Сканируйте или выберите товар\n2. Назовите сумму клиенту\n3. Примите оплату (наличные/карта/QR)\n4. Напечатайте чек\n\n### Возвраты:\nТребуют подтверждения старшего продавца",
    attachments: [{ id: 2, name: "Инструкция_касса.pdf", format: "pdf" }],
    courseId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
  105: {
    id: 105,
    name: "Открытие и закрытие смены",
    category: "Процедуры",
    description: "Чек-листы",
    text: "## Открытие смены\n\n- [ ] Проверить температуру в зале и на кухне\n- [ ] Включить кофемашину\n- [ ] Проверить наличие хлеба на полках\n- [ ] Убрать зал\n- [ ] Проверить запас пакетов\n\n## Закрытие смены\n\n- [ ] Подсчитать выручку\n- [ ] Сдать инкассацию\n- [ ] Убрать рабочее место\n- [ ] Выключить оборудование\n- [ ] Снять Z-отчёт",
    attachments: [],
    courseId: 1,
    createdAt: "2024-01-15T00:00:00Z",
  },
  106: {
    id: 106,
    name: "Приветствие клиента",
    category: "Сервис",
    description: "Первое впечатление",
    text: "## Приветствие клиента\n\n### Правила:\n1. Улыбнуться\n2. Посмотреть в глаза\n3. Сказать: \"Добро пожаловать в Робин Сдобин!\"\n4. Предложить помощь\n\n### Тональность:\nДружелюбная, но не навязчивая",
    attachments: [],
    courseId: 2,
    createdAt: "2024-02-01T00:00:00Z",
  },
  107: {
    id: 107,
    name: "Техника допродаж",
    category: "Продажи",
    description: "Upsell и cross-sell",
    text: "## Допродажи\n\n### Upsell (более дорогой вариант):\n- \"Может, взять большой батон? Выгоднее на 20%\"\n\n### Cross-sell (сопутствующий товар):\n- К хлебу — масло или джем\n- К кофе — круассан\n- К пицце — соус\n\n### Главное:\nНе навязываться! Предложить, а не настаивать.",
    attachments: [],
    courseId: 2,
    createdAt: "2024-02-01T00:00:00Z",
  },
  108: {
    id: 108,
    name: "Работа с претензиями",
    category: "Сервис",
    description: "По HEART",
    text: "## HEART метод\n\n**H**ear — Выслушайте (не перебивайте)\n**E**mpathize — Сочувствуйте (\"Понимаю, как это неприятно\")\n**A**pologize — Извинитесь (\"Приношу извинения\")\n**R**esolve — Решите (замена/возврат/компенсация)\n**T**hank — Поблагодарите (\"Спасибо, что сказали\")\n\nЗаписывайте все жалобы в журнал.",
    attachments: [],
    courseId: 2,
    createdAt: "2024-02-01T00:00:00Z",
  },
  109: {
    id: 109,
    name: "Лояльность клиентов",
    category: "Сервис",
    description: "Постоянные покупатели",
    text: "## Программа лояльности\n\n### Карта \"Робин Сдобин\"\n- 1 балл за каждые 10₽\n- 100 баллов = 50₽ скидки\n\n### Персональные предложения:\n- Скидка в день рождения 20%\n- Ранний доступ к новинкам\n- Специальные цены для постоянных",
    attachments: [],
    courseId: 2,
    createdAt: "2024-02-01T00:00:00Z",
  },
  110: {
    id: 110,
    name: "Хлеб и хлебобулочные изделия",
    category: "Ассортимент",
    description: "Виды хлеба",
    text: "## Наш хлеб\n\n### Белый:\n- Батон нарезной\n- Багет французский\n- Булка молочная\n\n### Чёрный/серый:\n- Ржаной заварной\n- Бородинский\n- Сумский\n\n### Специальный:\n- Бездрожжевой\n- С отрубями\n- Диабетический",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
  111: {
    id: 111,
    name: "Сдобная выпечка",
    category: "Ассортимент",
    description: "Круассаны, слойки",
    text: "## Сдоба\n\n### Круассаны:\n- Классический\n- С шоколадом\n- С миндалём\n- Сэндвич-круассан\n\n### Слойки:\n- С вишней\n- С яблоком\n- С сыром\n- С курицей",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
  112: {
    id: 112,
    name: "Торты и пирожные",
    category: "Ассортимент",
    description: "Кондитерка",
    text: "## Кондитерка\n\n### Торты (на заказ):\n- Медовик\n- Наполеон\n- Чизкейк\n- Тирамису\n\n### Пирожные:\n- Эклеры\n- Профитроли\n- Макароны\n- Мини-тортики",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
  113: {
    id: 113,
    name: "Полуфабрикаты",
    category: "Ассортимент",
    description: "Пицца, пельмени",
    text: "## Полуфабрикаты\n\n### Пицца:\n- Маргарита\n- Пепперони\n- 4 сыра\n- Деревенская\n\n### Другие:\n- Пельмени домашние\n- Вареники с картошкой\n- Блинчики с начинкой",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
  114: {
    id: 114,
    name: "Условия хранения",
    category: "Хранение",
    description: "Температурные режимы",
    text: "## Температурные режимы\n\n### Хлеб:\n- Хранение: +18...+25°C\n- Витрина: не более 4 часов\n\n### Выпечка с кремом:\n- Холодильник: +2...+6°C\n- Срок: 24 часа\n\n### Полуфабрикаты:\n- Морозилка: -18°C\n- Разморозка: только 1 раз",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
  115: {
    id: 115,
    name: "Сроки годности",
    category: "Хранение",
    description: "Маркировка",
    text: "## Сроки годности\n\n### Хлеб:\n- Батон: 24 часа\n- Багет: 6 часов\n- Хлеб ржаной: 48 часов\n\n### Выпечка:\n- Круассаны: 12 часов\n- Слойки: 6 часов\n- С кремом: 24 часа (в холодильнике)\n\n### Контроль:\n- Списывать до истечения срока\n- Не продавать просроченное\n- Журнал списания",
    attachments: [],
    courseId: 3,
    createdAt: "2024-03-01T00:00:00Z",
  },
};

const MOCK_TEST_TASKS: Record<number, TestTask[]> = {
  201: [
    { id: 1, name: "Какой срок годности у багета?", description: "", points: 1, answerVariants: ["4 часа", "6 часов", "12 часов", "24 часа"] },
    { id: 2, name: "Что делать с просроченным товаром?", description: "", points: 1, answerVariants: ["Продать со скидкой", "Списать и выбросить", "Оставить на полке", "Перемаркировать"] },
    { id: 3, name: "Как часто мыть руки?", description: "", points: 1, answerVariants: ["Раз в смену", "Каждые 2 часа", "Только после туалета", "По необходимости"] },
  ],
  202: [
    { id: 4, name: "Какой код возврата требует подтверждения?", description: "", points: 1, answerVariants: ["Любой возврат", "Только отказ", "Любой с чеком", "Требуется подтверждение старшего"] },
  ],
  203: [
    { id: 5, name: "Первый шаг в HEART?", description: "", points: 1, answerVariants: ["Извиниться", "Выслушать", "Предложить решение", "Поблагодарить"] },
  ],
  204: [
    { id: 6, name: "Сколько градусов в морозилке?", description: "", points: 1, answerVariants: ["-6°C", "-12°C", "-18°C", "-24°C"] },
  ],
  205: [
    { id: 7, name: "Можно ли разморозить продукт 2 раза?", description: "", points: 1, answerVariants: ["Да", "Нет", "Только хлеб", "Только выпечку"] },
  ],
};

const MOCK_TEST_RESULTS: Record<number, TestResult> = {
  201: { testId: 201, testName: "Итоговый тест: Базовый курс", score: 0, maxScore: 20, percentage: 0, isPassed: false },
  202: { testId: 202, testName: "Проверка знаний: Касса", score: 8, maxScore: 10, percentage: 80, isPassed: true },
  203: { testId: 203, testName: "Тест: Стандарты обслуживания", score: 0, maxScore: 15, percentage: 0, isPassed: false },
  204: { testId: 204, testName: "Тест: Ассортимент", score: 23, maxScore: 25, percentage: 92, isPassed: true },
  205: { testId: 205, testName: "Повторный тест: Хранение", score: 10, maxScore: 12, percentage: 83, isPassed: true },
};

// Track mock state in memory
let mockCompletedMaterials = new Set<number>([101, 102]);
let mockTestProgress: Record<number, { currentTaskIndex: number; answers: Record<number, number> }> = {};

// ============ API IMPLEMENTATION ============

interface CourseListItemDTO {
  id: number;
  name: string;
  description: string | null;
  materials_count: number;
  tests_count: number;
}

interface CoursesListDTO {
  items: CourseListItemDTO[];
}

interface CourseMaterialItemDTO {
  id: number;
  material_id: number;
  name: string;
  category: string;
  description: string | null;
  is_completed: boolean;
}

interface CourseTestItemDTO {
  id: number;
  test_id: number;
  name: string;
  category: string;
  is_final: boolean;
  tasks_count: number;
  is_passed: boolean;
  score: number | null;
}

interface CourseDTO {
  id: number;
  name: string;
  description: string | null;
  rating_points: number;
  mrp: number;
  materials_count: number;
  tests_count: number;
  created_at: string;
  materials: CourseMaterialItemDTO[];
  tests: CourseTestItemDTO[];
  user_points_by_course: number | null;
  is_course_completed: boolean | null;
}

interface MaterialAttachmentDTO {
  id: number;
  name: string;
  format: string;
}

interface MaterialDTO {
  id: number;
  name: string;
  category: string;
  description: string | null;
  text: string;
  attachments: MaterialAttachmentDTO[];
  course_id: number;
  created_at: string;
}

interface TestTaskDTO {
  id: number;
  name: string;
  description: string | null;
  points: number;
  answer_variants: string[];
}

interface StartTestResultDTO {
  test_id: number;
  test_name: string;
  tasks_count: number;
  first_task: TestTaskDTO;
}

interface SubmitAnswerResultDTO {
  is_correct: boolean;
  points_earned: number;
  next_task: TestTaskDTO | null;
  is_test_completed: boolean;
}

interface TestResultDTO {
  test_id: number;
  test_name: string;
  score: number;
  max_score: number;
  percentage: number;
  is_passed: boolean;
}

interface CompleteMaterialResultDTO {
  material_id: number;
  course_id: number;
}

interface CompleteCourseResultDTO {
  course_id: number;
  completed: boolean;
  message: string;
  completed_materials: number;
  total_materials: number;
  passed_tests: number;
  total_tests: number;
  user_points: number;
  required_points: number;
}

function mapCompleteCourseResult(dto: CompleteCourseResultDTO): CompleteCourseResult {
  return {
    courseId: dto.course_id,
    completed: dto.completed,
    message: dto.message,
    completedMaterials: dto.completed_materials,
    totalMaterials: dto.total_materials,
    passedTests: dto.passed_tests,
    totalTests: dto.total_tests,
    userPoints: dto.user_points,
    requiredPoints: dto.required_points,
  };
}

function mapCourseItem(dto: CourseListItemDTO): CourseListItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    materialsCount: dto.materials_count,
    testsCount: dto.tests_count,
  };
}

function mapCourseMaterialItem(dto: CourseMaterialItemDTO): CourseMaterialItem {
  return {
    id: dto.id,
    materialId: dto.material_id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    isCompleted: dto.is_completed,
  };
}

function mapCourseTestItem(dto: CourseTestItemDTO): CourseTestItem {
  return {
    id: dto.id,
    testId: dto.test_id,
    name: dto.name,
    category: dto.category,
    isFinal: dto.is_final,
    tasksCount: dto.tasks_count,
    isPassed: dto.is_passed,
    score: dto.score,
  };
}

function mapCourse(dto: CourseDTO): Course {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    ratingPoints: dto.rating_points,
    mrp: dto.mrp,
    materialsCount: dto.materials_count,
    testsCount: dto.tests_count,
    createdAt: dto.created_at,
    materials: dto.materials.map(mapCourseMaterialItem),
    tests: dto.tests.map(mapCourseTestItem),
    userPointsByCourse: dto.user_points_by_course,
    isCourseCompleted: dto.is_course_completed,
  };
}

function mapAttachment(dto: MaterialAttachmentDTO): MaterialAttachment {
  return { id: dto.id, name: dto.name, format: dto.format };
}

function mapMaterial(dto: MaterialDTO): Material {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    text: dto.text,
    attachments: dto.attachments.map(mapAttachment),
    courseId: dto.course_id,
    createdAt: dto.created_at,
  };
}

function mapTask(dto: TestTaskDTO): TestTask {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    points: dto.points,
    answerVariants: dto.answer_variants,
  };
}

// Helper to get fresh mock course with current state
function getMockCourse(courseId: number): Course | null {
  const base = MOCK_COURSES[courseId];
  if (!base) return null;

  return {
    ...base,
    materials: base.materials.map(m => ({
      id: m.id,
      materialId: m.materialId,
      name: m.name,
      category: m.category,
      description: m.description,
      isCompleted: mockCompletedMaterials.has(m.materialId),
    })),
  };
}

class KnowledgeAPIImpl {
  async listCourses(signal?: AbortSignal): Promise<CourseListItem[]> {
    if (isMockKB()) {
      return MOCK_COURSES_LIST;
    }
    const response = await apiClient.get<CoursesListDTO>("/kb/courses/", { signal });
    return response.items.map(mapCourseItem);
  }

  async getCourse(courseId: number, signal?: AbortSignal): Promise<Course> {
    if (isMockKB()) {
      const course = getMockCourse(courseId);
      if (!course) throw new Error("Course not found");
      return course;
    }
    const response = await apiClient.get<CourseDTO>(`/kb/courses/${courseId}`, { signal });
    return mapCourse(response);
  }

  async getMaterial(materialId: number, courseId: number): Promise<Material> {
    if (isMockKB()) {
      const material = MOCK_MATERIALS[materialId];
      if (!material) throw new Error("Material not found");
      return material;
    }
    const response = await apiClient.get<MaterialDTO>(`/kb/materials/${materialId}`, {
      query: { course_id: courseId },
    });
    return mapMaterial(response);
  }

  async completeMaterial(courseId: number, materialId: number): Promise<CompleteMaterialResult> {
    if (isMockKB()) {
      mockCompletedMaterials.add(materialId);
      return { materialId, courseId };
    }
    const response = await apiClient.post<CompleteMaterialResultDTO>("/kb/materials/complete", {
      course_id: courseId,
      material_id: materialId,
    });
    return { materialId: response.material_id, courseId: response.course_id };
  }

  async startTest(courseId: number, testId: number): Promise<StartTestResult> {
    if (isMockKB()) {
      const tasks = MOCK_TEST_TASKS[testId];
      if (!tasks || tasks.length === 0) throw new Error("Test not found");
      
      mockTestProgress[testId] = { currentTaskIndex: 0, answers: {} };
      
      return {
        testId,
        testName: MOCK_TEST_RESULTS[testId]?.testName || "Тест",
        tasksCount: tasks.length,
        firstTask: tasks[0],
      };
    }
    const response = await apiClient.post<StartTestResultDTO>("/kb/tests/start", {
      course_id: courseId,
      test_id: testId,
    });
    return {
      testId: response.test_id,
      testName: response.test_name,
      tasksCount: response.tasks_count,
      firstTask: mapTask(response.first_task),
    };
  }

  async submitAnswer(
    courseId: number,
    testId: number,
    taskId: number,
    selectedVariant: number,
  ): Promise<SubmitAnswerResult> {
    if (isMockKB()) {
      const tasks = MOCK_TEST_TASKS[testId];
      const progress = mockTestProgress[testId];
      if (!tasks || !progress) throw new Error("Test not started");

      // Mock: correct if selected index is 1 (for demo purposes)
      const isCorrect = selectedVariant === 1;
      const pointsEarned = isCorrect ? tasks[progress.currentTaskIndex].points : 0;
      
      progress.answers[taskId] = selectedVariant;
      progress.currentTaskIndex++;
      
      const isTestCompleted = progress.currentTaskIndex >= tasks.length;
      const nextTask = isTestCompleted ? null : tasks[progress.currentTaskIndex];

      return {
        isCorrect,
        pointsEarned,
        nextTask,
        isTestCompleted,
      };
    }
    const response = await apiClient.post<SubmitAnswerResultDTO>("/kb/tests/submit-answer", {
      course_id: courseId,
      test_id: testId,
      task_id: taskId,
      selected_variant: selectedVariant,
    });
    return {
      isCorrect: response.is_correct,
      pointsEarned: response.points_earned,
      nextTask: response.next_task ? mapTask(response.next_task) : null,
      isTestCompleted: response.is_test_completed,
    };
  }

  async getTestResult(testId: number, courseId: number): Promise<TestResult> {
    if (isMockKB()) {
      const result = MOCK_TEST_RESULTS[testId];
      if (!result) throw new Error("Test result not found");
      return result;
    }
    const response = await apiClient.get<TestResultDTO>(`/kb/tests/${testId}/result`, {
      query: { course_id: courseId },
    });
    return {
      testId: response.test_id,
      testName: response.test_name,
      score: response.score,
      maxScore: response.max_score,
      percentage: response.percentage,
      isPassed: response.is_passed,
    };
  }

  async completeCourse(courseId: number): Promise<CompleteCourseResult> {
    if (isMockKB()) {
      const course = MOCK_COURSES[courseId];
      if (!course) throw new Error("Course not found");

      const completedMaterials = course.materials.filter(m => mockCompletedMaterials.has(m.materialId)).length;
      const totalMaterials = course.materials.length;
      const passedTests = course.tests.filter(t => t.isPassed).length;
      const totalTests = course.tests.length;
      const userPoints = course.userPointsByCourse || 0;
      const requiredPoints = course.mrp;

      const canComplete = completedMaterials === totalMaterials && 
                         passedTests === totalTests && 
                         userPoints >= requiredPoints;

      if (!canComplete) {
        const missing = [];
        if (completedMaterials < totalMaterials) missing.push(`материалов: ${completedMaterials}/${totalMaterials}`);
        if (passedTests < totalTests) missing.push(`тестов: ${passedTests}/${totalTests}`);
        if (userPoints < requiredPoints) missing.push(`баллов: ${userPoints}/${requiredPoints}`);
        
        return {
          courseId,
          completed: false,
          message: `Не выполнены требования: ${missing.join(", ")}`,
          completedMaterials,
          totalMaterials,
          passedTests,
          totalTests,
          userPoints,
          requiredPoints,
        };
      }

      return {
        courseId,
        completed: true,
        message: "Курс успешно завершён!",
        completedMaterials,
        totalMaterials,
        passedTests,
        totalTests,
        userPoints,
        requiredPoints,
      };
    }
    const response = await apiClient.post<CompleteCourseResultDTO>("/kb/courses/complete", {
      course_id: courseId,
    });
    return mapCompleteCourseResult(response);
  }

  // ============ COURSE CRUD ============

  async createCourse(data: { name: string; description?: string; ratingPoints?: number; mrp?: number }): Promise<CourseListItem> {
    const response = await apiClient.post<CourseListItemDTO>("/admin/education/courses", {
      name: data.name,
      description: data.description,
      rating_points: data.ratingPoints,
      mrp: data.mrp,
    });
    return mapCourseItem(response);
  }

  async updateCourse(courseId: number, data: { name?: string; description?: string; ratingPoints?: number; mrp?: number }): Promise<CourseListItem> {
    const response = await apiClient.put<CourseListItemDTO>(`/admin/education/courses/${courseId}`, {
      name: data.name,
      description: data.description,
      rating_points: data.ratingPoints,
      mrp: data.mrp,
    });
    return mapCourseItem(response);
  }

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`/admin/education/courses/${courseId}`);
  }

  // ============ ENROLLMENTS ============

  async listCourseEnrollments(
    courseId: number,
  ): Promise<Array<{ userId: string; name: string; progress: number; isCompleted: boolean }>> {
    const response = await apiClient.get<{
      items: Array<{ user_id: string; name: string; progress: number; is_completed: boolean }>;
    }>(`/admin/education/courses/${courseId}/enrollments`);
    return response.items.map((item) => ({
      userId: item.user_id,
      name: item.name,
      progress: item.progress,
      isCompleted: item.is_completed,
    }));
  }

  async assignCourseToUser(courseId: number, userId: string): Promise<void> {
    await apiClient.post(`/admin/education/courses/${courseId}/enrollments`, { user_id: userId });
  }

  async removeCourseFromUser(courseId: number, userId: string): Promise<void> {
    await apiClient.delete(`/admin/education/courses/${courseId}/enrollments/${userId}`);
  }

  async resetCourseProgress(courseId: number, userId: string): Promise<void> {
    await apiClient.post(`/admin/education/courses/${courseId}/enrollments/${userId}/reset`);
  }

  async resetTestProgress(courseId: number, userId: string, testId: number): Promise<void> {
    await apiClient.post(`/admin/education/courses/${courseId}/enrollments/${userId}/reset-test/${testId}`);
  }

  async assignMaterialToCourse(courseId: number, materialId: number, order = 0): Promise<void> {
    await apiClient.post(`/admin/education/courses/${courseId}/materials`, { material_id: materialId, order });
  }

  async removeMaterialFromCourse(courseId: number, materialId: number): Promise<void> {
    await apiClient.delete(`/admin/education/courses/${courseId}/materials/${materialId}`);
  }

  async assignTestToCourse(courseId: number, testId: number, isFinal = false): Promise<void> {
    await apiClient.post(`/admin/education/courses/${courseId}/tests`, { test_id: testId, is_final: isFinal });
  }

  async removeTestFromCourse(courseId: number, testId: number): Promise<void> {
    await apiClient.delete(`/admin/education/courses/${courseId}/tests/${testId}`);
  }

  // ============ MATERIAL CRUD ============

  async listMaterials(): Promise<Material[]> {
    const response = await apiClient.get<{ items: MaterialDTO[] }>("/admin/education/materials");
    return response.items.map(mapMaterial);
  }

  async createMaterial(data: { name: string; category: string; description?: string; text: string }): Promise<Material> {
    const response = await apiClient.post<MaterialDTO>("/admin/education/materials", {
      name: data.name,
      category: data.category,
      description: data.description,
      text: data.text,
    });
    return mapMaterial(response);
  }

  async updateMaterial(materialId: number, data: { name?: string; category?: string; description?: string; text?: string }): Promise<Material> {
    const response = await apiClient.put<MaterialDTO>(`/admin/education/materials/${materialId}`, {
      name: data.name,
      category: data.category,
      description: data.description,
      text: data.text,
    });
    return mapMaterial(response);
  }

  async deleteMaterial(materialId: number): Promise<void> {
    await apiClient.delete(`/admin/education/materials/${materialId}`);
  }

  // ============ ATTACHMENTS ============

  async uploadMaterialAttachment(materialId: number, file: File): Promise<MaterialAttachment> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<MaterialAttachmentDTO>(`/admin/education/materials/${materialId}/attachments`, formData);
    return mapAttachment(response);
  }

  async deleteMaterialAttachment(materialId: number, attachmentId: number): Promise<void> {
    await apiClient.delete(`/admin/education/materials/${materialId}/attachments/${attachmentId}`);
  }

  async resolveMaterialAttachments(
    materialId: number,
    courseId: number,
    attachmentIds: number[],
  ): Promise<MaterialAttachmentLink[]> {
    const response = await apiClient.post<{
      items: Array<{ attachment_id: number; url: string }>;
    }>(`/kb/materials/${materialId}/attachments/resolve`, {
      course_id: courseId,
      attachment_ids: attachmentIds,
    });
    return response.items.map((item) => ({
      attachmentId: item.attachment_id,
      url: item.url,
    }));
  }

  // ============ TEST CRUD ============

  async listTests(): Promise<Test[]> {
    const response = await apiClient.get<{
      items: Array<{
        id: number;
        name: string;
        category: string;
        description: string | null;
        is_final: boolean;
        pass_score_percent: number;
        tasks_count: number;
        total_points: number;
        course_id: number;
        created_at: string;
      }>;
    }>("/admin/education/tests");
    return response.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      isFinal: item.is_final,
      passScorePercent: item.pass_score_percent,
      tasksCount: item.tasks_count,
      totalPoints: item.total_points,
      courseId: item.course_id,
      createdAt: item.created_at,
    }));
  }

  async createTest(data: { name: string; category: string; description?: string; isFinal?: boolean; passScorePercent?: number }): Promise<Test> {
    const response = await apiClient.post<{
      id: number;
      name: string;
      category: string;
      description: string | null;
      is_final: boolean;
      pass_score_percent: number;
      tasks_count: number;
      total_points: number;
      course_id: number;
      created_at: string;
    }>("/admin/education/tests", {
      name: data.name,
      category: data.category,
      description: data.description,
      is_final: data.isFinal,
      pass_score_percent: data.passScorePercent,
    });
    return {
      id: response.id,
      name: response.name,
      category: response.category,
      description: response.description,
      isFinal: response.is_final,
      passScorePercent: response.pass_score_percent,
      tasksCount: response.tasks_count,
      totalPoints: response.total_points,
      courseId: response.course_id,
      createdAt: response.created_at,
    };
  }

  async updateTest(testId: number, data: { name?: string; category?: string; description?: string; isFinal?: boolean; passScorePercent?: number }): Promise<Test> {
    const response = await apiClient.put<{
      id: number;
      name: string;
      category: string;
      description: string | null;
      is_final: boolean;
      pass_score_percent: number;
      tasks_count: number;
      total_points: number;
      course_id: number;
      created_at: string;
    }>(`/admin/education/tests/${testId}`, {
      name: data.name,
      category: data.category,
      description: data.description,
      is_final: data.isFinal,
      pass_score_percent: data.passScorePercent,
    });
    return {
      id: response.id,
      name: response.name,
      category: response.category,
      description: response.description,
      isFinal: response.is_final,
      passScorePercent: response.pass_score_percent,
      tasksCount: response.tasks_count,
      totalPoints: response.total_points,
      courseId: response.course_id,
      createdAt: response.created_at,
    };
  }

  async deleteTest(testId: number): Promise<void> {
    await apiClient.delete(`/admin/education/tests/${testId}`);
  }

  // ============ TEST TASKS ============

  async createTestTask(data: {
    name: string;
    description?: string;
    points?: number;
    answerVariants: string[];
    correctVariant: number;
  }): Promise<TestTaskAdmin> {
    const response = await apiClient.post<{
      id: number;
      name: string;
      description: string | null;
      points: number;
      answer_variants: string[];
      correct_variant: number;
    }>("/admin/education/test-tasks", {
      name: data.name,
      description: data.description,
      points: data.points,
      answer_variants: data.answerVariants,
      correct_variant: data.correctVariant,
    });
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      points: response.points,
      answerVariants: response.answer_variants,
      correctVariant: response.correct_variant,
    };
  }

  async updateTestTask(
    taskId: number,
    data: {
      name?: string;
      description?: string;
      points?: number;
      answerVariants?: string[];
      correctVariant?: number;
    },
  ): Promise<TestTaskAdmin> {
    const response = await apiClient.put<{
      id: number;
      name: string;
      description: string | null;
      points: number;
      answer_variants: string[];
      correct_variant: number;
    }>(`/admin/education/test-tasks/${taskId}`, {
      name: data.name,
      description: data.description,
      points: data.points,
      answer_variants: data.answerVariants,
      correct_variant: data.correctVariant,
    });
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      points: response.points,
      answerVariants: response.answer_variants,
      correctVariant: response.correct_variant,
    };
  }

  async deleteTestTask(taskId: number): Promise<void> {
    await apiClient.delete(`/admin/education/test-tasks/${taskId}`);
  }

  async assignTaskToTest(testId: number, taskId: number, order: number): Promise<void> {
    await apiClient.post(`/admin/education/tests/${testId}/tasks`, undefined, {
      query: { task_id: taskId, order },
    });
  }

  async removeTaskFromTest(testId: number, taskId: number): Promise<void> {
    await apiClient.delete(`/admin/education/tests/${testId}/tasks/${taskId}`);
  }
}

export const KnowledgeAPI = new KnowledgeAPIImpl();

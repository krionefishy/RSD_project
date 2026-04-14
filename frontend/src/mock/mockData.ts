import { Material, Test, TestQuestion, ManagerStore, ManagerEmployee, NetworkBlock, Account, TimesheetUpload, Assignment, LearningReport, Course } from "../types/data";

// ────────────────────────────────────────────────
// Courses (новая структура - курсы вместо разделов)
// ────────────────────────────────────────────────
export const courses: Course[] = [
  {
    id: "course-1",
    title: "Новый сотрудник: Базовый курс",
    description: "Обязательный курс для всех новых сотрудников. Основы работы на точке, санитарные нормы, работа с кассой.",
    icon: "UserPlus",
    color: "#2E7D32",
    bg: "#E8F5E9",
    materialsCount: 8,
    testsCount: 2,
    categories: ["Организация работы", "Санитария", "Кассовые операции"],
    duration: "4 часа",
    progress: 100,
    status: "completed",
    isRequired: true,
    assignedAt: "01.03.2026",
    completedAt: "15.03.2026",
  },
  {
    id: "course-2",
    title: "Стандарты обслуживания",
    description: "Всё о работе с клиентами: приветствие, допродажи, работа с претензиями, стандарты сервиса.",
    icon: "MessageSquare",
    color: "#C41E3A",
    bg: "#FCE4EC",
    materialsCount: 6,
    testsCount: 1,
    categories: ["Сервис", "Скрипты продаж", "Работа с возражениями"],
    duration: "3 часа",
    progress: 65,
    status: "in-progress",
    isRequired: true,
    assignedAt: "10.04.2026",
  },
  {
    id: "course-3",
    title: "Ассортимент и продукция",
    description: "Изучение всего ассортимента: хлеб, выпечка, торты, полуфабрикаты. Условия хранения, сроки годности.",
    icon: "Package",
    color: "#F5A623",
    bg: "#FFF8E1",
    materialsCount: 12,
    testsCount: 2,
    categories: ["Продуктовая линейка", "Хранение", "Маркировка"],
    duration: "5 часов",
    progress: 30,
    status: "in-progress",
    isRequired: true,
    assignedAt: "05.04.2026",
  },
  {
    id: "course-4",
    title: "Технологические карты",
    description: "Для производственного персонала. Рецептуры, технология приготовления, контроль качества.",
    icon: "ClipboardList",
    color: "#0891B2",
    bg: "#E0F7FA",
    materialsCount: 15,
    testsCount: 3,
    categories: ["Техкарты", "Рецептуры", "Контроль качества"],
    duration: "6 часов",
    progress: 0,
    status: "not-started",
    isRequired: false,
  },
  {
    id: "course-5",
    title: "Открытие и закрытие смены",
    description: "Чек-листы и процедуры для ответственных сотрудников. Инкассация, оформление документов.",
    icon: "Calendar",
    color: "#7C3AED",
    bg: "#F3E5F5",
    materialsCount: 5,
    testsCount: 1,
    categories: ["Организация смены", "Отчётность"],
    duration: "2 часа",
    progress: 0,
    status: "not-started",
    isRequired: true,
    assignedAt: "20.04.2026",
  },
  {
    id: "course-6",
    title: "Работа с кассой и 1С",
    description: "Продвинутый курс по кассовым операциям, возвратам, работе с программой 1С.",
    icon: "Monitor",
    color: "#0F766E",
    bg: "#CCFBF1",
    materialsCount: 7,
    testsCount: 1,
    categories: ["Касса", "1С", "Возвраты"],
    duration: "3 часа",
    progress: 0,
    status: "not-started",
    isRequired: false,
  },
];

// ────────────────────────────────────────────────
// Legacy Knowledge Sections (for backward compatibility)
// ────────────────────────────────────────────────
export const knowledgeSections = [
  {
    id: "work-org",
    title: "Организация смены",
    icon: "Briefcase",
    color: "#2E7D32",
    bg: "#EFF6FF",
    count: 12,
    progress: 75,
  },
  {
    id: "scripts",
    title: "Стандарты сервиса",
    icon: "MessageSquare",
    color: "#C41E3A",
    bg: "#F5F3FF",
    count: 8,
    progress: 50,
  },
  {
    id: "products",
    title: "Описание продуктов",
    icon: "Package",
    color: "#F5A623",
    bg: "#ECFEFF",
    count: 24,
    progress: 30,
  },
  {
    id: "tech-cards",
    title: "Технологические карты",
    icon: "ClipboardList",
    color: "#059669",
    bg: "#ECFDF5",
    count: 6,
    progress: 83,
  },
];

// ────────────────────────────────────────────────
// Course Materials (привязаны к курсам)
// ────────────────────────────────────────────────
export const courseMaterials: Record<string, Material[]> = {
  "course-1": [
    { id: "m1", courseId: "course-1", title: "Добро пожаловать в команду!", type: "text", duration: "10 мин", status: "done", progress: 100 },
    { id: "m2", courseId: "course-1", title: "Правила внутреннего распорядка", type: "text", duration: "15 мин", status: "done", progress: 100 },
    { id: "m3", courseId: "course-1", title: "Санитарные нормы и гигиена", type: "video", duration: "20 мин", status: "done", progress: 100 },
    { id: "m4", courseId: "course-1", title: "Униформа и внешний вид", type: "text", duration: "5 мин", status: "done", progress: 100 },
    { id: "m5", courseId: "course-1", title: "Рабочий график и табель", type: "text", duration: "8 мин", status: "done", progress: 100 },
    { id: "m6", courseId: "course-1", title: "Открытие смены: чек-лист", type: "video", duration: "15 мин", status: "done", progress: 100 },
    { id: "m7", courseId: "course-1", title: "Работа с кассой: основы", type: "video", duration: "25 мин", status: "done", progress: 100 },
    { id: "m8", courseId: "course-1", title: "Закрытие смены и инкассация", type: "text", duration: "12 мин", status: "done", progress: 100 },
  ],
  "course-2": [
    { id: "m9", courseId: "course-2", title: "Приветствие клиента", type: "video", duration: "10 мин", status: "done", progress: 100 },
    { id: "m10", courseId: "course-2", title: "Техника допродаж (Upsell)", type: "text", duration: "15 мин", status: "done", progress: 100 },
    { id: "m11", courseId: "course-2", title: "Работа с претензиями по HEART", type: "video", duration: "20 мин", status: "in-progress", progress: 60 },
    { id: "m12", courseId: "course-2", title: "Обслуживание в пиковые часы", type: "text", duration: "12 мин", status: "not-started", progress: 0 },
    { id: "m13", courseId: "course-2", title: "Лояльность и постоянные клиенты", type: "text", duration: "10 мин", status: "not-started", progress: 0 },
    { id: "m14", courseId: "course-2", title: "Сезонные предложения: презентация", type: "document", duration: "15 мин", status: "not-started", progress: 0 },
  ],
  "course-3": [
    { id: "m15", courseId: "course-3", title: "Хлеб и хлебобулочные изделия", type: "text", duration: "20 мин", status: "done", progress: 100 },
    { id: "m16", courseId: "course-3", title: "Сдобная выпечка", type: "video", duration: "15 мин", status: "done", progress: 100 },
    { id: "m17", courseId: "course-3", title: "Торты и пирожные", type: "text", duration: "25 мин", status: "in-progress", progress: 40 },
    { id: "m18", courseId: "course-3", title: "Полуфабрикаты", type: "text", duration: "18 мин", status: "not-started", progress: 0 },
    { id: "m19", courseId: "course-3", title: "Условия хранения и сроки годности", type: "text", duration: "15 мин", status: "not-started", progress: 0 },
    { id: "m20", courseId: "course-3", title: "Аллергены и состав продукции", type: "document", duration: "20 мин", status: "not-started", progress: 0 },
  ],
};

// ────────────────────────────────────────────────
// Legacy Section Materials
// ────────────────────────────────────────────────
export const sectionMaterials: Record<string, Material[]> = {
  "work-org": [
    { id: "m1", courseId: "work-org", title: "Открытие точки: чеклист", type: "text", duration: "5 мин", status: "done", progress: 100 },
    { id: "m2", courseId: "work-org", title: "Санитарные нормы и гигиена", type: "text", duration: "8 мин", status: "done", progress: 100 },
    { id: "m3", courseId: "work-org", title: "Работа с кассой", type: "video", duration: "12 мин", status: "in-progress", progress: 60 },
    { id: "m4", courseId: "work-org", title: "Приёмка товара", type: "document", duration: "15 мин", status: "not-started", progress: 0 },
    { id: "m5", courseId: "work-org", title: "Закрытие смены и инкассация", type: "text", duration: "6 мин", status: "not-started", progress: 0 },
  ],
  "scripts": [
    { id: "m7", courseId: "scripts", title: "Приветствие и допродажи (Upsell)", type: "text", duration: "6 мин", status: "done", progress: 100 },
    { id: "m8", courseId: "scripts", title: "Работа с претензиями (HEART)", type: "video", duration: "10 мин", status: "done", progress: 100 },
    { id: "m9", courseId: "scripts", title: "Презентация сезонного ассортимента", type: "text", duration: "8 мин", status: "in-progress", progress: 40 },
  ],
  "products": [
    { id: "m11", courseId: "products", title: "Основной ассортимент", type: "text", duration: "12 мин", status: "done", progress: 100 },
    { id: "m12", courseId: "products", title: "Специальные предложения", type: "document", duration: "20 мин", status: "in-progress", progress: 25 },
    { id: "m13", courseId: "products", title: "Условия хранения товара", type: "text", duration: "10 мин", status: "not-started", progress: 0 },
  ],
  "tech-cards": [
    { id: "m15", courseId: "tech-cards", title: "Технологическая карта: основы", type: "text", duration: "5 мин", status: "done", progress: 100 },
    { id: "m16", courseId: "tech-cards", title: "Авторские рецептуры", type: "text", duration: "7 мин", status: "done", progress: 100 },
    { id: "m17", courseId: "tech-cards", title: "Контроль качества продукции", type: "video", duration: "9 мин", status: "done", progress: 100 },
  ],
};

export const materialContent: Record<string, { title: string; content: string; hasVideo?: boolean; videoTitle?: string }> = {
  m3: {
    title: "Работа с кассой",
    content: `## Основные операции
Работа с кассой на точке требует внимательности и соблюдения регламентов.

### Открытие смены
1. Авторизуйтесь по карте сотрудника
2. Проверьте остаток наличности в денежном ящике (X-отчет)
3. Убедитесь в наличии чековой ленты

### Оформление заказа
1. Выберите товар в каталоге
2. Выберите количество / объём
3. Добавьте дополнительные позиции
4. Выберите тип оплаты

### Списание брака
Если товар повреждён, необходимо провести списание через меню администратора с указанием причины.`,
    hasVideo: true,
    videoTitle: "Как работать с кассой",
  },
};

// ────────────────────────────────────────────────
// Tests (привязаны к курсам)
// ────────────────────────────────────────────────
export const tests: Test[] = [
  { id: "t1", courseId: "course-1", title: "Итоговый тест: Базовый курс", questionsCount: 20, status: "passed", score: 92 },
  { id: "t2", courseId: "course-1", title: "Проверка знаний: Кассовые операции", questionsCount: 10, status: "passed", score: 88 },
  { id: "t3", courseId: "course-2", title: "Тест: Стандарты обслуживания", questionsCount: 15, status: "assigned", deadline: "25.04.2026" },
  { id: "t4", courseId: "course-3", title: "Тест: Ассортимент", questionsCount: 25, status: "assigned", deadline: "30.04.2026" },
  { id: "t5", courseId: "course-2", title: "Повторный тест: Допродажи", questionsCount: 12, status: "repeat", score: 60, deadline: "20.04.2026" },
];

export const testQuestions: TestQuestion[] = [
  { id: "q1", text: "Какой минимальный срок годности у багета?", options: ["4 часа", "6 часов", "8 часов", "12 часов"], correct: 1 },
  { id: "q2", text: "Что делать при обнаружении просроченного товара?", options: ["Списать и выбросить", "Продать со скидкой", "Оставить на полке", "Перемаркировать"], correct: 0 },
  { id: "q3", text: "Как правильно приветствовать клиента?", options: ["Здравствуйте", "Привет", "Добро пожаловать в Робин Сдобин", "Все варианты верны"], correct: 3 },
];

// ────────────────────────────────────────────────
// Sales & Rating
// ────────────────────────────────────────────────
export const salesData = {
  daily: {
    plan: 450000,
    fact: 387420,
    percent: 86,
    bonus: 15497,
    chart: Array.from({ length: 7 }, (_, i) => ({
      day: `${i + 8}.04`,
      plan: Math.round(50000 + Math.random() * 15000),
      fact: Math.round(42000 + Math.random() * 18000),
    })),
    positions: [
      { name: "Хлеб", plan: 120000, fact: 115000 },
      { name: "Выпечка", plan: 150000, fact: 132420 },
      { name: "Торты", plan: 100000, fact: 95000 },
      { name: "Кофе", plan: 80000, fact: 45000 },
    ],
  },
  periodic: {
    plan: 3200000,
    fact: 2748000,
    percent: 86,
    bonus: 92450,
    chart: [
      { day: "Нед 1", plan: 800000, fact: 740000 },
      { day: "Нед 2", plan: 800000, fact: 705000 },
      { day: "Нед 3", plan: 800000, fact: 670000 },
      { day: "Нед 4", plan: 800000, fact: 633000 },
    ],
    positions: [
      { name: "Хлеб", plan: 900000, fact: 845000 },
      { name: "Выпечка", plan: 1100000, fact: 980000 },
      { name: "Торты", plan: 700000, fact: 610000 },
      { name: "Кофе", plan: 500000, fact: 313000 },
    ],
  },
};

export const ratingData = {
  sales: {
    myPosition: 7,
    change: -2,
    myValue: "387 420 ₽",
    total: 48,
    list: [
      { rank: 1, name: "Ольга Крылова", store: "ТЦ Метрополис", value: "524 680 ₽", isMe: false },
      { rank: 2, name: "Мария Федорова", store: "ТЦ Европарк", value: "498 120 ₽", isMe: false },
      { rank: 3, name: "Анна Смирнова", store: "ТЦ Вегас", value: "476 850 ₽", isMe: false },
      { rank: 4, name: "Кирилл Захаров", store: "ТЦ Крокус", value: "445 200 ₽", isMe: false },
      { rank: 5, name: "Иван Волков", store: "ТЦ Мега", value: "412 340 ₽", isMe: false },
      { rank: 6, name: "Алексей Петров", store: "ТЦ Рио", value: "401 890 ₽", isMe: false },
      { rank: 7, name: "Анна Иванова", store: "ТЦ Метрополис", value: "387 420 ₽", isMe: true },
    ],
  },
  learning: {
    myPosition: 3,
    change: 1,
    myValue: "85%",
    total: 48,
    list: [
      { rank: 1, name: "Ольга Крылова", store: "ТЦ Метрополис", value: "98%", isMe: false },
      { rank: 2, name: "Мария Федорова", store: "ТЦ Европарк", value: "94%", isMe: false },
      { rank: 3, name: "Анна Иванова", store: "ТЦ Метрополис", value: "85%", isMe: true },
      { rank: 4, name: "Кирилл Захаров", store: "ТЦ Крокус", value: "82%", isMe: false },
      { rank: 5, name: "Иван Волков", store: "ТЦ Мега", value: "78%", isMe: false },
      { rank: 6, name: "Мария Сидорова", store: "ТЦ Рио", value: "75%", isMe: false },
    ],
  },
};

// ────────────────────────────────────────────────
// Schedule
// ────────────────────────────────────────────────
export const scheduleData = {
  month: "Апрель 2026",
  days: Array.from({ length: 30 }, (_, i) => ({
    date: i + 1,
    type: (["work", "work", "work", "off", "work", "vacation", "sick"] as const)[i % 7],
    shift: i % 7 === 3 || i % 7 === 5 || i % 7 === 6 ? undefined : i % 2 === 0 ? "09:00-18:00" : "14:00-23:00",
  })),
};

// ────────────────────────────────────────────────
// Manager Data
// ────────────────────────────────────────────────
export const managerStores: ManagerStore[] = [
  { id: "s1", name: "ТЦ Метрополис", plan: 850000, fact: 742000, percent: 87, employees: 8 },
  { id: "s2", name: "ТЦ Европарк", plan: 920000, fact: 891000, percent: 97, employees: 10 },
  { id: "s3", name: "ТЦ Крокус Сити", plan: 780000, fact: 654000, percent: 84, employees: 7 },
];

export const managerEmployees: ManagerEmployee[] = [
  { id: "e1", name: "Анна Иванова", store: "ТЦ Метрополис", position: "Продавец", salesPercent: 92, learningPercent: 85, status: "work" },
  { id: "e2", name: "Кирилл Захаров", store: "ТЦ Метрополис", position: "Продавец", salesPercent: 88, learningPercent: 78, status: "work" },
  { id: "e3", name: "Мария Федорова", store: "ТЦ Европарк", position: "Старший продавец", salesPercent: 98, learningPercent: 94, status: "vacation" },
  { id: "e4", name: "Ольга Крылова", store: "ТЦ Крокус", position: "Продавец", salesPercent: 95, learningPercent: 98, status: "work" },
  { id: "e5", name: "Иван Волков", store: "ТЦ Метрополис", position: "Продавец", salesPercent: 76, learningPercent: 72, status: "sick" },
];

export const managerReports = [
  { id: "r1", title: "Еженедельный отчет по продажам", date: "14.04.2026", type: "sales" as const },
  { id: "r2", title: "Анализ обучения персонала", date: "10.04.2026", type: "learning" as const },
  { id: "r3", title: "Отчет по посещаемости", date: "01.04.2026", type: "attendance" as const },
];

// ────────────────────────────────────────────────
// SuperAdmin Data
// ────────────────────────────────────────────────
export const networkBlocks: NetworkBlock[] = [
  { id: "1", name: "Центр", stores: 12, employees: 38, salesPercent: 94 },
  { id: "2", name: "Юг", stores: 11, employees: 35, salesPercent: 91 },
  { id: "3", name: "Север", stores: 10, employees: 32, salesPercent: 88 },
  { id: "4", name: "Запад", stores: 8, employees: 22, salesPercent: 76 },
  { id: "5", name: "Восток", stores: 6, employees: 15, salesPercent: 82 },
];

export const accounts: Account[] = [
  { id: "1", name: "Ирина Козлова", email: "irina.kozlova@rsd.ru", role: "superadmin", roleLabel: "СуперАдмин", status: "active" },
  { id: "2", name: "Алексей Смирнов", email: "alexey.smirnov@rsd.ru", role: "admin-po", roleLabel: "Админ ПО", status: "active" },
  { id: "3", name: "Сергей Лебедев", email: "sergey.lebedev@rsd.ru", role: "admin-sales", roleLabel: "Админ Продаж", status: "active" },
];

// ────────────────────────────────────────────────
// Timesheets
// ────────────────────────────────────────────────
export const timesheetUploads: TimesheetUpload[] = [
  { id: "ts1", period: "Апрель 2026", fileName: "tabel_april_2026.xlsx", uploadedAt: "01.04.2026", uploadedBy: "Дмитрий Волков", employeesCount: 142, status: "processed" },
  { id: "ts2", period: "Март 2026", fileName: "tabel_march_2026.xlsx", uploadedAt: "01.03.2026", uploadedBy: "Дмитрий Волков", employeesCount: 140, status: "processed" },
  { id: "ts3", period: "Февраль 2026", fileName: "tabel_february_2026.xlsx", uploadedAt: "01.02.2026", uploadedBy: "Дмитрий Волков", employeesCount: 138, status: "processed" },
];

// ────────────────────────────────────────────────
// Admin Edu Data
// ────────────────────────────────────────────────
export const adminEduStats = {
  totalMaterials: 48,
  totalTests: 12,
  activeAssignments: 86,
  avgScore: 72,
};

export const adminEduAssignments: Assignment[] = [
  { id: "a1", testTitle: "Стандарты обслуживания", assignedTo: "Анна Иванова", assignedBy: "Елена Морозова", assignedAt: "01.04.2026", deadline: "20.04.2026", status: "completed", score: 90 },
  { id: "a2", testTitle: "Стандарты обслуживания", assignedTo: "Кирилл Захаров", assignedBy: "Елена Морозова", assignedAt: "01.04.2026", deadline: "20.04.2026", status: "in-progress" },
  { id: "a3", testTitle: "Ассортимент", assignedTo: "Мария Федорова", assignedBy: "Елена Морозова", assignedAt: "05.04.2026", deadline: "30.04.2026", status: "overdue" },
];

export const learningReports: LearningReport[] = [
  { sectionName: "Новый сотрудник: Базовый курс", avgProgress: 82, assignedCount: 148, completedCount: 124 },
  { sectionName: "Стандарты обслуживания", avgProgress: 68, assignedCount: 148, completedCount: 89 },
  { sectionName: "Ассортимент и продукция", avgProgress: 45, assignedCount: 148, completedCount: 67 },
  { sectionName: "Технологические карты", avgProgress: 91, assignedCount: 32, completedCount: 29 },
];

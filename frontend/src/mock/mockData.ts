import { Material, Test, TestQuestion, RatingItem, ManagerStore, ManagerEmployee, NetworkBlock, Account, TimesheetUpload, Assignment, LearningReport } from "../types/data";

// ────────────────────────────────────────────────
// Knowledge Base
// ────────────────────────────────────────────────
export const knowledgeSections = [
  {
    id: "work-org",
    title: "Организация смены",
    icon: "Briefcase",
    color: "#1A56DB",
    bg: "#EFF6FF",
    count: 12,
    progress: 75,
  },
  {
    id: "scripts",
    title: "Стандарты сервиса",
    icon: "MessageSquare",
    color: "#7C3AED",
    bg: "#F5F3FF",
    count: 8,
    progress: 50,
  },
  {
    id: "products",
    title: "Описание продуктов",
    icon: "Package",
    color: "#0891B2",
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

export const sectionMaterials: Record<string, Material[]> = {
  "work-org": [
    { id: "m1", sectionId: "work-org", title: "Открытие точки: чеклист", type: "text", duration: "5 мин", status: "done", progress: 100 },
    { id: "m2", sectionId: "work-org", title: "Санитарные нормы и гигиена", type: "text", duration: "8 мин", status: "done", progress: 100 },
    { id: "m3", sectionId: "work-org", title: "Работа с кассой", type: "video", duration: "12 мин", status: "in-progress", progress: 60 },
    { id: "m4", sectionId: "work-org", title: "Приёмка товара", type: "document", duration: "15 мин", status: "not-started", progress: 0 },
    { id: "m5", sectionId: "work-org", title: "Закрытие смены и инкассация", type: "text", duration: "6 мин", status: "not-started", progress: 0 },
  ],
  "scripts": [
    { id: "m7", sectionId: "scripts", title: "Приветствие и допродажи (Upsell)", type: "text", duration: "6 мин", status: "done", progress: 100 },
    { id: "m8", sectionId: "scripts", title: "Работа с претензиями (HEART)", type: "video", duration: "10 мин", status: "done", progress: 100 },
    { id: "m9", sectionId: "scripts", title: "Презентация сезонного ассортимента", type: "text", duration: "8 мин", status: "in-progress", progress: 40 },
  ],
  "products": [
    { id: "m11", sectionId: "products", title: "Основной ассортимент", type: "text", duration: "12 мин", status: "done", progress: 100 },
    { id: "m12", sectionId: "products", title: "Специальные предложения", type: "document", duration: "20 мин", status: "in-progress", progress: 25 },
    { id: "m13", sectionId: "products", title: "Условия хранения товара", type: "text", duration: "10 мин", status: "not-started", progress: 0 },
  ],
  "tech-cards": [
    { id: "m15", sectionId: "tech-cards", title: "Технологическая карта: основы", type: "text", duration: "5 мин", status: "done", progress: 100 },
    { id: "m16", sectionId: "tech-cards", title: "Авторские рецептуры", type: "text", duration: "7 мин", status: "done", progress: 100 },
    { id: "m17", sectionId: "tech-cards", title: "Контроль качества продукции", type: "video", duration: "9 мин", status: "done", progress: 100 },
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
// Tests (без таймера)
// ────────────────────────────────────────────────
export const tests: Test[] = [
  { id: "t1", sectionId: "work-org", title: "Стандарты обслуживания", questionsCount: 10, status: "passed", score: 90 },
  { id: "t2", sectionId: "work-org", title: "Регламенты точки", questionsCount: 15, status: "assigned", deadline: "20.04.2026" },
  { id: "t3", sectionId: "scripts", title: "Техника допродаж", questionsCount: 12, status: "repeat", score: 55, deadline: "18.04.2026" },
  { id: "t4", sectionId: "products", title: "Знание ассортимента", questionsCount: 20, status: "assigned", deadline: "25.04.2026" },
  { id: "t5", sectionId: "tech-cards", title: "Рецептуры и техкарты", questionsCount: 8, status: "passed", score: 100 },
];

export const testQuestions: TestQuestion[] = [
  {
    id: "q1",
    text: "Каков срок годности товара после вскрытия упаковки?",
    options: ["12 часов", "24 часа", "48 часов", "7 дней"],
    correct: 1,
  },
  {
    id: "q2",
    text: "Что необходимо проверить при приёмке товара?",
    options: ["Только количество", "Количество и срок годности", "Количество, срок годности и целостность упаковки", "Ничего"],
    correct: 2,
  },
  {
    id: "q3",
    text: "Первое действие при обнаружении просроченного товара на полке?",
    options: ["Продать со скидкой", "Убрать с полки и оформить списание", "Игнорировать", "Вернуть поставщику"],
    correct: 1,
  },
  {
    id: "q4",
    text: "Какой документ оформляется при возврате товара покупателем?",
    options: ["Товарная накладная", "Акт возврата", "Счёт-фактура", "Ничего"],
    correct: 1,
  },
  {
    id: "q5",
    text: "Как правильно обработать возражение клиента «дорого»?",
    options: ["Согласиться и дать скидку", "Объяснить ценность товара", "Промолчать", "Предложить другой товар без объяснения"],
    correct: 1,
  },
];

// ────────────────────────────────────────────────
// Sales
// ────────────────────────────────────────────────
export const salesData = {
  daily: {
    plan: 65000,
    fact: 52100,
    percent: 80,
    bonus: 4200,
    chart: [
      { day: "Пн", plan: 55000, fact: 58200 },
      { day: "Вт", plan: 55000, fact: 52100 },
      { day: "Ср", plan: 55000, fact: 48900 },
      { day: "Чт", plan: 55000, fact: 62100 },
      { day: "Пт", plan: 65000, fact: 77600 },
      { day: "Сб", plan: 80000, fact: 91200 },
      { day: "Вс", plan: 75000, fact: 72100 },
    ],
    positions: [
      { name: "Основной ассортимент", plan: 30000, fact: 27500 },
      { name: "Спецпредложения", plan: 15000, fact: 12200 },
      { name: "Сопутствующие товары", plan: 12000, fact: 8900 },
      { name: "Товары в упаковке", plan: 5000, fact: 2800 },
      { name: "Аксессуары", plan: 3000, fact: 700 },
    ],
  },
  periodic: {
    plan: 1800000,
    fact: 1420000,
    percent: 79,
    bonus: 24500,
    chart: [
      { day: "Нед 1", plan: 450000, fact: 438000 },
      { day: "Нед 2", plan: 450000, fact: 415000 },
      { day: "Нед 3", plan: 450000, fact: 567000 },
      { day: "Нед 4", plan: 450000, fact: 0 },
    ],
    positions: [
      { name: "Основной ассортимент", plan: 800000, fact: 712000 },
      { name: "Спецпредложения", plan: 400000, fact: 328000 },
      { name: "Сопутствующие товары", plan: 350000, fact: 281000 },
      { name: "Товары в упаковке", plan: 150000, fact: 68000 },
      { name: "Аксессуары", plan: 100000, fact: 31000 },
    ],
  },
};

// ────────────────────────────────────────────────
// Rating
// ────────────────────────────────────────────────
export const ratingData = {
  sales: {
    myPosition: 2,
    change: +1,
    myValue: "52 100 ₽",
    total: 12,
    list: [
      { rank: 1, name: "Кирилл Захаров", store: "Точка Сити", value: "72 400 ₽", isMe: false },
      { rank: 2, name: "Анна Иванова", store: "Точка Центр", value: "52 100 ₽", isMe: true },
      { rank: 3, name: "Мария Федорова", store: "Точка Express", value: "41 800 ₽", isMe: false },
      { rank: 4, name: "Павел Орлов", store: "Точка Север", value: "39 600 ₽", isMe: false },
    ] as RatingItem[],
  },
  learning: {
    myPosition: 4,
    change: -1,
    myValue: "75%",
    total: 12,
    list: [
      { rank: 1, name: "Ольга Крылова", store: "Точка Центр", value: "98%", isMe: false },
      { rank: 2, name: "Мария Федорова", store: "Точка Express", value: "94%", isMe: false },
      { rank: 3, name: "Татьяна Ефимова", store: "Точка Сити", value: "89%", isMe: false },
      { rank: 4, name: "Анна Иванова", store: "Точка Центр", value: "75%", isMe: true },
    ] as RatingItem[],
  },
};

// ────────────────────────────────────────────────
// Schedule
// ────────────────────────────────────────────────
export const scheduleData = {
  month: "Апрель 2026",
  days: [
    { date: 1, type: "work" as const, shift: "08:00–17:00" },
    { date: 2, type: "work" as const, shift: "08:00–17:00" },
    { date: 14, type: "work" as const, shift: "08:00–17:00" },
  ],
};

// ────────────────────────────────────────────────
// Manager data
// ────────────────────────────────────────────────
export const managerStores: ManagerStore[] = [
  { id: "s1", name: "Точка «Зерно», Центр", plan: 1800000, fact: 1720000, percent: 95, employees: 6 },
  { id: "s2", name: "Точка Express, Павелецкая", plan: 1200000, fact: 860000, percent: 71, employees: 4 },
  { id: "s3", name: "Точка & Co, Сити", plan: 2500000, fact: 2320000, percent: 92, employees: 8 },
  { id: "s4", name: "Точка «Зерно», Север", plan: 1500000, fact: 1180000, percent: 78, employees: 5 },
];

export const managerEmployees: ManagerEmployee[] = [
  { id: "e1", name: "Анна Иванова", store: "Точка Центр", position: "Продавец", salesPercent: 78, learningPercent: 75, status: "work" },
  { id: "e2", name: "Кирилл Захаров", store: "Точка Сити", position: "Старший продавец", salesPercent: 116, learningPercent: 71, status: "work" },
  { id: "e3", name: "Мария Федорова", store: "Точка Express", position: "Продавец", salesPercent: 72, learningPercent: 94, status: "work" },
  { id: "e4", name: "Ольга Крылова", store: "Точка Центр", position: "Старший продавец", salesPercent: 97, learningPercent: 98, status: "work" },
  { id: "e5", name: "Иван Волков", store: "Точка Север", position: "Продавец", salesPercent: 61, learningPercent: 68, status: "off" },
];

// ────────────────────────────────────────────────
// SuperAdmin — network blocks
// ────────────────────────────────────────────────
export const networkBlocks: NetworkBlock[] = [
  { id: "b1", name: "Блок А — Центр", stores: 4, employees: 42, salesPercent: 91 },
  { id: "b2", name: "Блок Б — Юг", stores: 3, employees: 36, salesPercent: 87 },
  { id: "b3", name: "Блок В — Север", stores: 3, employees: 38, salesPercent: 78 },
  { id: "b4", name: "Блок Г — Запад", stores: 2, employees: 32, salesPercent: 72 },
];

// ────────────────────────────────────────────────
// Admin PO — accounts list
// ────────────────────────────────────────────────
export const accounts: Account[] = [
  { id: "a1", name: "Елена Смирнова", email: "e.smirnova@rsd.ru", role: "admin-edu", roleLabel: "Админ Обучение", status: "active" },
  { id: "a2", name: "Александр Козлов", email: "a.kozlov@rsd.ru", role: "admin-sales", roleLabel: "Админ Продажи", status: "active" },
  { id: "a3", name: "Наталья Новикова", email: "n.novikova@rsd.ru", role: "admin-personnel", roleLabel: "Админ Персонал", status: "active" },
  { id: "a4", name: "Дмитрий Петров", email: "d.petrov@rsd.ru", role: "manager", roleLabel: "Менеджер", status: "active" },
  { id: "a5", name: "Анна Иванова", email: "a.ivanova@rsd.ru", role: "seller", roleLabel: "Продавец", status: "active" },
  { id: "a6", name: "Павел Орлов", email: "p.orlov@rsd.ru", role: "seller", roleLabel: "Продавец", status: "blocked" },
];

// ────────────────────────────────────────────────
// Timesheets
// ────────────────────────────────────────────────
export const timesheetUploads: TimesheetUpload[] = [
  { id: "ts1", period: "Март 2026", fileName: "tab_mart_2026.xlsx", uploadedAt: "2026-03-31T10:23:00", uploadedBy: "Наталья Новикова", employeesCount: 142, status: "processed" },
  { id: "ts2", period: "Февраль 2026", fileName: "tab_fevral_2026.xlsx", uploadedAt: "2026-02-28T14:15:00", uploadedBy: "Наталья Новикова", employeesCount: 138, status: "processed" },
];

// ────────────────────────────────────────────────
// Assignments (for Admin Edu)
// ────────────────────────────────────────────────
export const assignments: Assignment[] = [
  { id: "as1", testTitle: "Стандарты обслуживания", assignedTo: "Анна Иванова", assignedBy: "Елена Смирнова", assignedAt: "2026-04-10", deadline: "2026-04-20", status: "completed", score: 90 },
  { id: "as2", testTitle: "Техника допродаж", assignedTo: "Кирилл Захаров", assignedBy: "Елена Смирнова", assignedAt: "2026-04-12", deadline: "2026-04-18", status: "in-progress" },
  { id: "as3", testTitle: "Знание ассортимента", assignedTo: "Мария Федорова", assignedBy: "Елена Смирнова", assignedAt: "2026-04-05", deadline: "2026-04-15", status: "overdue" },
];

// ────────────────────────────────────────────────
// Learning Reports (for Admin Edu)
// ────────────────────────────────────────────────
export const learningReports: LearningReport[] = [
  { sectionName: "Организация смены", avgProgress: 78, assignedCount: 145, completedCount: 112 },
  { sectionName: "Стандарты сервиса", avgProgress: 65, assignedCount: 142, completedCount: 89 },
  { sectionName: "Описание продуктов", avgProgress: 42, assignedCount: 145, completedCount: 52 },
  { sectionName: "Технологические карты", avgProgress: 88, assignedCount: 145, completedCount: 128 },
];

import { ManagerStore, ManagerEmployee, NetworkBlock, Account, TimesheetUpload, Assignment, LearningReport } from "../types/data";

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

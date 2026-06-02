import { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Home,
  LockKeyhole,
  MapPin,
  PieChart,
  Plus,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Upload,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import "./DemoApp.css";

type RoleId =
  | "seller"
  | "manager"
  | "admin-edu"
  | "admin-sales"
  | "admin-personnel"
  | "admin-po"
  | "superadmin";

type DemoPageId =
  | "dashboard"
  | "accounts"
  | "users"
  | "create"
  | "blocks"
  | "locations"
  | "timesheets"
  | "profile"
  | "knowledge"
  | "tests"
  | "sales"
  | "rating"
  | "reports"
  | "manage"
  | "assignments"
  | "settings"
  | "data";

interface DemoPage {
  id: DemoPageId;
  label: string;
  icon: LucideIcon;
}

interface DemoRole {
  id: RoleId;
  label: string;
  person: string;
  position: string;
  accent: string;
  pages: DemoPage[];
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "blue" | "red";
}

type RowTone = Stat["tone"];

interface DemoRow {
  name: string;
  meta: string;
  status: string;
  tone: RowTone;
}

const toneMap = {
  green: { bg: "#e8f5e9", color: "#2e7d32" },
  amber: { bg: "#fffbeb", color: "#b45309" },
  blue: { bg: "#eff6ff", color: "#2563eb" },
  red: { bg: "#fef2f2", color: "#dc2626" },
};

const roles: DemoRole[] = [
  {
    id: "admin-po",
    label: "Админ ПО",
    person: "Алексей Смирнов",
    position: "Администратор ПО",
    accent: "#2e7d32",
    pages: [
      { id: "accounts", label: "Аккаунты", icon: Users },
      { id: "data", label: "Данные", icon: Database },
      { id: "reports", label: "Отчеты", icon: FileText },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "admin-personnel",
    label: "Админ персонала",
    person: "Дмитрий Волков",
    position: "Администратор персонала",
    accent: "#2e7d32",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "users", label: "Сотрудники", icon: Users },
      { id: "create", label: "Создать", icon: Plus },
      { id: "blocks", label: "Блоки", icon: Building2 },
      { id: "timesheets", label: "Табели", icon: FileSpreadsheet },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "seller",
    label: "Продавец",
    person: "Анна Иванова",
    position: "Продавец-консультант",
    accent: "#2e7d32",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "knowledge", label: "База знаний", icon: BookOpen },
      { id: "tests", label: "Тесты", icon: GraduationCap },
      { id: "sales", label: "Продажи", icon: ShoppingBag },
      { id: "rating", label: "Рейтинг", icon: Award },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "manager",
    label: "Менеджер",
    person: "Марина Орлова",
    position: "Управляющий блоком",
    accent: "#2563eb",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "users", label: "Сотрудники", icon: Users },
      { id: "locations", label: "Точки", icon: Store },
      { id: "reports", label: "Отчеты", icon: BarChart3 },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "admin-edu",
    label: "Админ обучения",
    person: "Елена Морозова",
    position: "Администратор обучения",
    accent: "#7c3aed",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "manage", label: "Управление", icon: BookOpen },
      { id: "assignments", label: "Назначения", icon: ClipboardList },
      { id: "reports", label: "Отчеты", icon: PieChart },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "admin-sales",
    label: "Админ продаж",
    person: "Сергей Лебедев",
    position: "Администратор продаж",
    accent: "#c2410c",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "sales", label: "Планы", icon: ShoppingBag },
      { id: "rating", label: "Мотивация", icon: Award },
      { id: "reports", label: "Отчеты", icon: BarChart3 },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
  {
    id: "superadmin",
    label: "Суперадмин",
    person: "Ирина Козлова",
    position: "Суперадминистратор",
    accent: "#111827",
    pages: [
      { id: "dashboard", label: "Главная", icon: Home },
      { id: "blocks", label: "Структура", icon: Building2 },
      { id: "accounts", label: "Аккаунты", icon: ShieldCheck },
      { id: "settings", label: "Настройки", icon: SlidersHorizontal },
      { id: "profile", label: "Профиль", icon: User },
    ],
  },
];

const people: DemoRow[] = [
  { name: "Анна Иванова", meta: "ТЦ Метрополис · продавец", status: "Активен", tone: "green" },
  { name: "Кирилл Захаров", meta: "ТЦ Метрополис · старший продавец", status: "Резерв", tone: "amber" },
  { name: "Мария Федорова", meta: "ТЦ Европарк · продавец", status: "Отпуск", tone: "blue" },
  { name: "Иван Волков", meta: "ТЦ Рио · продавец", status: "Блок", tone: "red" },
] ;

const accounts: Array<DemoRow & { role: string }> = [
  { name: "Ирина Козлова", meta: "superadmin_001", role: "Суперадмин", status: "Активен", tone: "green" },
  { name: "Алексей Смирнов", meta: "admin_po_001", role: "Админ ПО", status: "Активен", tone: "green" },
  { name: "Дмитрий Волков", meta: "admin_staff_001", role: "Админ персонала", status: "Активен", tone: "green" },
  { name: "Иван Волков", meta: "seller_082", role: "Продавец", status: "Заблокирован", tone: "red" },
] ;

const blocks: DemoRow[] = [
  { name: "Центр", meta: "12 точек · 38 сотрудников", status: "94%", tone: "green" },
  { name: "Север", meta: "10 точек · 32 сотрудника", status: "88%", tone: "blue" },
  { name: "Запад", meta: "8 точек · 22 сотрудника", status: "76%", tone: "amber" },
] ;

const locations: DemoRow[] = [
  { name: "ТЦ Метрополис", meta: "8 сотрудников · план 87%", status: "Открыта", tone: "green" },
  { name: "ТЦ Европарк", meta: "10 сотрудников · план 97%", status: "Открыта", tone: "green" },
  { name: "ТЦ Крокус", meta: "7 сотрудников · план 84%", status: "Проверка", tone: "amber" },
] ;

const learning: DemoRow[] = [
  { name: "Стандарты обслуживания", meta: "12 материалов · 4 теста", status: "86%", tone: "green" },
  { name: "Ассортимент и продукция", meta: "18 материалов · 5 тестов", status: "68%", tone: "amber" },
  { name: "Новый сотрудник", meta: "7 материалов · 2 теста", status: "92%", tone: "green" },
] ;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function getDefaultPage(role: DemoRole): DemoPageId {
  return role.pages[0]?.id ?? "dashboard";
}

function Stats({ items }: { items: Stat[] }) {
  return (
    <div className={items.length === 3 ? "demo-grid-3" : "demo-grid-2"}>
      {items.map((item) => {
        const tone = toneMap[item.tone];
        return (
          <div className="demo-card demo-stat" key={item.label}>
            <div className="demo-stat-icon" style={{ background: tone.bg }}>
              <item.icon size={18} color={tone.color} />
            </div>
            <p className="demo-stat-value">{item.value}</p>
            <p className="demo-stat-label">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function DataRows({ title, rows }: { title: string; rows: DemoRow[] }) {
  return (
    <div className="demo-card">
      <p className="demo-section-title">{title}</p>
      {rows.map((row) => (
        <div className="demo-row" key={`${title}-${row.name}`}>
          <div className={`demo-stat-icon`} style={{ background: toneMap[row.tone].bg }}>
            <User size={18} color={toneMap[row.tone].color} />
          </div>
          <div className="demo-row-main">
            <p className="demo-row-title">{row.name}</p>
            <p className="demo-row-meta">{row.meta}</p>
          </div>
          <span className={`demo-chip ${row.tone}`}>{row.status}</span>
        </div>
      ))}
    </div>
  );
}

function AccountRows() {
  return (
    <div className="demo-card">
      <p className="demo-section-title">Управление аккаунтами</p>
      {accounts.map((account) => (
        <div className="demo-row" key={account.meta}>
          <div className="demo-stat-icon" style={{ background: toneMap[account.tone].bg }}>
            <UserCog size={18} color={toneMap[account.tone].color} />
          </div>
          <div className="demo-row-main">
            <p className="demo-row-title">{account.name}</p>
            <p className="demo-row-meta">{account.meta}</p>
          </div>
          <span className={`demo-chip ${account.tone}`}>{account.role}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressRows({ title, rows }: { title: string; rows: DemoRow[] }) {
  return (
    <div className="demo-card">
      <p className="demo-section-title">{title}</p>
      {rows.map((row) => (
        <div className="demo-row" key={row.name}>
          <div className="demo-row-main">
            <p className="demo-row-title">{row.name}</p>
            <p className="demo-row-meta">{row.meta}</p>
            <div className="demo-progress" style={{ marginTop: 8 }}>
              <span style={{ width: row.status }} />
            </div>
          </div>
          <span className={`demo-chip ${row.tone}`}>{row.status}</span>
        </div>
      ))}
    </div>
  );
}

function Actions({ labels }: { labels: string[] }) {
  return (
    <div className="demo-card">
      <p className="demo-section-title">Быстрые действия</p>
      <div className="demo-action-row">
        {labels.map((label, index) => (
          <button className={index === 0 ? "demo-action" : "demo-action secondary"} key={label}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CreateEmployeePage() {
  return (
    <div className="demo-content">
      <div className="demo-card">
        <p className="demo-section-title">Новый сотрудник</p>
        <div className="demo-form">
          <input className="demo-input" value="seller_143" readOnly aria-label="Внешний ID" />
          <input className="demo-input" value="Наталья" readOnly aria-label="Имя" />
          <input className="demo-input" value="Соколова" readOnly aria-label="Фамилия" />
          <input className="demo-input" value="ТЦ Метрополис" readOnly aria-label="Точка" />
          <button className="demo-action">Создать профиль и временный пароль</button>
        </div>
      </div>
      <Actions labels={["Загрузить аватар", "Назначить блок", "Задать ставку"]} />
    </div>
  );
}

function TimesheetsPage() {
  return (
    <div className="demo-content">
      <Stats
        items={[
          { label: "Строк в импорте", value: "142", icon: FileSpreadsheet, tone: "green" },
          { label: "Ошибок", value: "3", icon: LockKeyhole, tone: "red" },
        ]}
      />
      <div className="demo-card">
        <p className="demo-section-title">Импорт табеля</p>
        <div className="demo-row">
          <div className="demo-stat-icon" style={{ background: "#e8f5e9" }}>
            <Upload size={18} color="#2e7d32" />
          </div>
          <div className="demo-row-main">
            <p className="demo-row-title">tabel_may_2026.xlsx</p>
            <p className="demo-row-meta">Период 01.05.2026 - 31.05.2026</p>
          </div>
          <span className="demo-chip green">Готово</span>
        </div>
      </div>
      <DataRows title="Корректировки" rows={people.slice(0, 3)} />
    </div>
  );
}

function ProfilePage({ role }: { role: DemoRole }) {
  return (
    <div className="demo-content">
      <div className="demo-card" style={{ textAlign: "center" }}>
        <div className="demo-avatar" style={{ margin: "0 auto 10px", background: role.accent }}>
          {initials(role.person)}
        </div>
        <p className="demo-section-title" style={{ marginBottom: 4 }}>{role.person}</p>
        <p className="demo-muted">{role.position}</p>
      </div>
      <Actions labels={["Редактировать профиль", "Сменить пароль", "Выйти"]} />
    </div>
  );
}

function RolePage({ role, pageId }: { role: DemoRole; pageId: DemoPageId }) {
  if (pageId === "profile") return <ProfilePage role={role} />;
  if (pageId === "create") return <CreateEmployeePage />;
  if (pageId === "timesheets") return <TimesheetsPage />;
  if (pageId === "accounts") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "Всего", value: "148", icon: Users, tone: "green" },
            { label: "Активных", value: "139", icon: ShieldCheck, tone: "green" },
            { label: "Блок", value: "9", icon: LockKeyhole, tone: "red" },
          ]}
        />
        <Actions labels={["Создать аккаунт", "Назначить блок", "Блокировать"]} />
        <AccountRows />
      </div>
    );
  }
  if (pageId === "blocks") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "Блоков", value: "5", icon: Building2, tone: "green" },
            { label: "Точек", value: "47", icon: MapPin, tone: "blue" },
          ]}
        />
        <DataRows title="Структура сети" rows={blocks} />
      </div>
    );
  }
  if (pageId === "locations") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "Точек", value: "47", icon: Store, tone: "green" },
            { label: "План сети", value: "89%", icon: BarChart3, tone: "blue" },
          ]}
        />
        <DataRows title="Торговые точки" rows={locations} />
      </div>
    );
  }
  if (pageId === "knowledge" || pageId === "manage") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "Курсов", value: "12", icon: BookOpen, tone: "green" },
            { label: "Тестов", value: "8", icon: GraduationCap, tone: "amber" },
          ]}
        />
        <ProgressRows title="Учебные разделы" rows={learning} />
      </div>
    );
  }
  if (pageId === "tests" || pageId === "assignments") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "Назначено", value: "86", icon: ClipboardList, tone: "green" },
            { label: "Просрочено", value: "7", icon: CalendarDays, tone: "red" },
          ]}
        />
        <ProgressRows title="Тесты и назначения" rows={learning} />
      </div>
    );
  }
  if (pageId === "sales" || pageId === "rating" || pageId === "reports") {
    return (
      <div className="demo-content">
        <Stats
          items={[
            { label: "План", value: "3.2M", icon: ShoppingBag, tone: "green" },
            { label: "Факт", value: "2.7M", icon: BarChart3, tone: "blue" },
            { label: "Бонус", value: "92K", icon: Award, tone: "amber" },
          ]}
        />
        <ProgressRows
          title="Показатели"
          rows={[
            { name: "Хлеб", meta: "845 000 из 900 000", status: "94%", tone: "green" },
            { name: "Выпечка", meta: "980 000 из 1 100 000", status: "89%", tone: "green" },
            { name: "Кофе", meta: "313 000 из 500 000", status: "63%", tone: "amber" },
          ]}
        />
      </div>
    );
  }
  if (pageId === "data" || pageId === "settings") {
    return (
      <div className="demo-content">
        <Actions labels={["Резервная копия", "Журнал событий", "Права ролей"]} />
        <div className="demo-card">
          <p className="demo-section-title">Системный журнал</p>
          {["Создан пользователь seller_143", "Назначен блок Центр", "Обновлена матрица ролей"].map((event) => (
            <div className="demo-row" key={event}>
              <CheckCircle2 size={18} color="#2e7d32" />
              <div className="demo-row-main">
                <p className="demo-row-title">{event}</p>
                <p className="demo-row-meta">Сегодня, 10:24</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="demo-content">
      <Stats
        items={[
          { label: "Сотрудников", value: role.id === "admin-personnel" ? "142" : "24", icon: Users, tone: "green" },
          { label: "Точек", value: "47", icon: Store, tone: "blue" },
          { label: "Задач", value: "12", icon: BriefcaseBusiness, tone: "amber" },
        ]}
      />
      <Actions labels={["Открыть список", "Сформировать отчет", "Экспорт"]} />
      <DataRows title="Последние изменения" rows={people} />
    </div>
  );
}

function DemoHeader({ role }: { role: DemoRole }) {
  return (
    <div className="demo-header" style={{ background: `linear-gradient(160deg, ${role.accent} 0%, #163f22 100%)` }}>
      <div className="demo-header-row">
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div className="demo-avatar">{initials(role.person)}</div>
          <div style={{ minWidth: 0 }}>
            <p className="demo-header-kicker">{role.position}</p>
            <p className="demo-header-name">{role.person}</p>
          </div>
        </div>
        <button className="demo-icon-button demo-avatar" style={{ width: 40, height: 40 }} aria-label="Профиль">
          <User size={18} />
        </button>
      </div>
    </div>
  );
}

function BottomNav({ role, pageId, setPageId }: { role: DemoRole; pageId: DemoPageId; setPageId: (page: DemoPageId) => void }) {
  const pages = role.pages.slice(0, 5);
  return (
    <div className="demo-phone-nav">
      {pages.map((page) => (
        <button
          className={`demo-nav-item ${page.id === pageId ? "is-active" : ""}`}
          key={page.id}
          onClick={() => setPageId(page.id)}
        >
          <page.icon size={21} strokeWidth={page.id === pageId ? 2.6 : 1.9} />
          <span>{page.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function DemoApp() {
  const [roleId, setRoleId] = useState<RoleId>("admin-po");
  const selectedRole = useMemo(() => roles.find((role) => role.id === roleId) ?? roles[0], [roleId]);
  const [pageByRole, setPageByRole] = useState<Record<RoleId, DemoPageId>>({
    seller: "dashboard",
    manager: "dashboard",
    "admin-edu": "dashboard",
    "admin-sales": "dashboard",
    "admin-personnel": "dashboard",
    "admin-po": "accounts",
    superadmin: "dashboard",
  });
  const pageId = selectedRole.pages.some((page) => page.id === pageByRole[selectedRole.id])
    ? pageByRole[selectedRole.id]
    : getDefaultPage(selectedRole);

  const setPageId = (nextPage: DemoPageId) => {
    setPageByRole((current) => ({ ...current, [selectedRole.id]: nextPage }));
  };

  const selectRole = (nextRole: RoleId) => {
    setRoleId(nextRole);
  };

  return (
    <div className="demo-root">
      <div className="demo-stage">
        <div className="demo-topbar">
          <div>
            <h1 className="demo-title">RSD demo design</h1>
            <p className="demo-subtitle">
              Автономный моковый фронт для демонстрации ролей, страниц и ключевых сценариев без подключения к backend.
            </p>
          </div>
          <div className="demo-tabs" style={{ minWidth: 330 }}>
            {["admin-po", "admin-personnel", "seller"].map((quickRole) => (
              <button
                className={`demo-tab ${quickRole === selectedRole.id ? "is-active" : ""}`}
                key={quickRole}
                onClick={() => selectRole(quickRole as RoleId)}
              >
                {roles.find((role) => role.id === quickRole)?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="demo-shell">
          <aside className="demo-panel">
            <p className="demo-side-title">Роли</p>
            <div className="demo-role-list">
              {roles.map((role) => (
                <button
                  className={`demo-role-button ${role.id === selectedRole.id ? "is-active" : ""}`}
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                >
                  <ShieldCheck size={17} />
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
            <p className="demo-side-title" style={{ marginTop: 18 }}>Страницы</p>
            <div className="demo-page-list">
              {selectedRole.pages.map((page) => (
                <button
                  className={`demo-page-button ${page.id === pageId ? "is-active" : ""}`}
                  key={page.id}
                  onClick={() => setPageId(page.id)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <page.icon size={16} />
                    {page.label}
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </aside>

          <main className="demo-phone" aria-label="Мобильное демо приложения">
            <div className="demo-phone-screen">
              <DemoHeader role={selectedRole} />
              <div className="demo-page">
                <RolePage role={selectedRole} pageId={pageId} />
              </div>
            </div>
            <BottomNav role={selectedRole} pageId={pageId} setPageId={setPageId} />
          </main>

          <aside className="demo-detail">
            <h2>Что проверяем</h2>
            <p className="demo-muted">
              Фокус первого показа: администратор ПО, администратор персонала и их пользовательские сценарии.
            </p>
            <div className="demo-checklist">
              <div className="demo-check">
                <CheckCircle2 size={17} />
                <span>Админ ПО: создание аккаунта, блокировка, назначение блока, журнал действий.</span>
              </div>
              <div className="demo-check">
                <CheckCircle2 size={17} />
                <span>Админ персонала: карточки сотрудников, создание профиля, структура, табели и корректировки.</span>
              </div>
              <div className="demo-check">
                <CheckCircle2 size={17} />
                <span>Остальные роли доступны из левого меню, чтобы быстро пройти весь дизайн без авторизации.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

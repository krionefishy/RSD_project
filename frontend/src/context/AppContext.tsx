import { createContext, useContext, useState, ReactNode } from "react";
import { AppUser, UserRole } from "../types/user";

interface AppContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export const mockUsers: Record<UserRole, AppUser> = {
  seller: {
    id: "u1",
    name: "Анна Иванова",
    firstName: "Анна",
    role: "seller",
    position: "Продавец",
    store: "Точка «Зерно», Центр",
    block: "Смена А",
    email: "a.ivanova@rsd.ru",
    phone: "+7 (916) 234-56-78",
    joinDate: "15.03.2023",
  },
  manager: {
    id: "u2",
    name: "Дмитрий Петров",
    firstName: "Дмитрий",
    role: "manager",
    position: "Управляющий точки",
    store: "Точка «Зерно», Центр",
    block: "Район Центр",
    email: "d.petrov@rsd.ru",
    phone: "+7 (916) 345-67-89",
    joinDate: "10.01.2021",
  },
  "admin-edu": {
    id: "u3",
    name: "Елена Смирнова",
    firstName: "Елена",
    role: "admin-edu",
    position: "Тренинг-менеджер",
    store: "Центральный офис",
    block: "Обучение и развитие",
    email: "e.smirnova@rsd.ru",
    phone: "+7 (916) 456-78-90",
    joinDate: "05.06.2022",
  },
  "admin-sales": {
    id: "u4",
    name: "Александр Козлов",
    firstName: "Александр",
    role: "admin-sales",
    position: "Коммерческий директор",
    store: "Центральный офис",
    block: "Продажи",
    email: "a.kozlov@rsd.ru",
    phone: "+7 (916) 567-89-01",
    joinDate: "20.09.2021",
  },
  "admin-personnel": {
    id: "u5",
    name: "Наталья Новикова",
    firstName: "Наталья",
    role: "admin-personnel",
    position: "HR-директор",
    store: "Центральный офис",
    block: "Персонал",
    email: "n.novikova@rsd.ru",
    phone: "+7 (916) 678-90-12",
    joinDate: "12.04.2022",
  },
  "admin-po": {
    id: "u6",
    name: "Сергей Морозов",
    firstName: "Сергей",
    role: "admin-po",
    position: "IT-директор",
    store: "Центральный офис",
    block: "Автоматизация",
    email: "s.morozov@rsd.ru",
    phone: "+7 (916) 789-01-23",
    joinDate: "01.02.2020",
  },
  superadmin: {
    id: "u7",
    name: "Михаил Соколов",
    firstName: "Михаил",
    role: "superadmin",
    position: "Основатель сети",
    store: "Все точки",
    block: "Совет директоров",
    email: "m.sokolov@rsd.ru",
    phone: "+7 (916) 890-12-34",
    joinDate: "15.11.2019",
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const logout = () => setUser(null);

  return (
    <AppContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

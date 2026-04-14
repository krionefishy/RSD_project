import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useApp, mockUsers } from "../../context/AppContext";
import { UserRole } from "../../types/user";

const roleRoutes: Record<UserRole, string> = {
  seller: "/seller",
  manager: "/manager",
  "admin-edu": "/admin-edu",
  "admin-sales": "/admin-sales",
  "admin-personnel": "/admin-personnel",
  "admin-po": "/admin-po",
  superadmin: "/superadmin",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolveUserByEmail = (rawEmail: string) => {
    const normalized = rawEmail.trim().toLowerCase();
    const emailAliases: Record<string, string> = {
      "anna.ivanova@rsd.ru": "a.ivanova@rsd.ru",
      "maria.fedorova@rsd.ru": "d.petrov@rsd.ru",
      "elena.morozova@rsd.ru": "e.smirnova@rsd.ru",
      "dmitry.volkov@rsd.ru": "n.novikova@rsd.ru",
      "sergey.lebedev@rsd.ru": "a.kozlov@rsd.ru",
      "alexey.smirnov@rsd.ru": "s.morozov@rsd.ru",
      "irina.kozlova@rsd.ru": "m.sokolov@rsd.ru",
    };

    const candidates = [normalized, emailAliases[normalized]].filter(Boolean);
    return Object.values(mockUsers).find((u) =>
      candidates.includes(u.email.toLowerCase()),
    );
  };

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Введите email и пароль");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = resolveUserByEmail(email);

      if (user) {
        setUser(user);
        navigate(roleRoutes[user.role]);
        toast.success(`Добро пожаловать, ${user.firstName}!`);
      } else {
        toast.error("Пользователь не найден. Проверьте email.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFC" }}>
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-10 px-6"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <span style={{ color: "#fff", fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>RSD</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 500, marginTop: 4 }}>
          Мобильный кабинет Продавца
        </p>
      </div>

      <div className="flex-1 flex flex-col px-5 py-6" style={{ background: "#F8FAFC" }}>
        <h2 style={{ color: "#1E293B", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Добро пожаловать
        </h2>
        <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
          Войдите в свой аккаунт
        </p>

        {/* Test Credentials */}
        <div className="mb-5 rounded-xl p-3" style={{ background: "#F1F5F9" }}>
          <p style={{ color: "#64748B", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>
            Тестовые данные для входа
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Продавец:</span>
            <span style={{ color: "#2E7D32", fontWeight: 500 }}>a.ivanova@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Менеджер:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>d.petrov@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Админ Обучения:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>e.smirnova@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Админ Персонала:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>n.novikova@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Админ Продаж:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>a.kozlov@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>Админ ПО:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>s.morozov@rsd.ru</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#374151" }}>СуперАдмин:</span>
              <span style={{ color: "#2E7D32", fontWeight: 500 }}>m.sokolov@rsd.ru</span>
            </div>
          </div>
          <p style={{ color: "#94A3B8", fontSize: 10, marginTop: 6 }}>
            Пароль любой (обязателен для кнопки входа)
          </p>
        </div>

        <div className="mb-4">
          <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Mail size={18} color="#94A3B8" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-[10px] border outline-none text-[15px]"
              style={{
                border: "1.5px solid #E2E8F0",
                color: "#1E293B",
                background: "#fff",
                fontSize: 15,
              }}
              placeholder="Введите email"
            />
          </div>
        </div>

        <div className="mb-6">
          <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Пароль
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Lock size={18} color="#94A3B8" />
            </div>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-10 rounded-[10px] border outline-none"
              style={{
                border: "1.5px solid #E2E8F0",
                color: "#1E293B",
                background: "#fff",
                fontSize: 15,
              }}
              placeholder="Введите пароль"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-12 rounded-[10px] flex items-center justify-center"
          style={{
            background: loading ? "#A5D6A7" : "#2E7D32",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {loading ? "Вход..." : "Войти"}
        </button>

        <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Забыли пароль? Обратитесь к администратору
        </p>
      </div>
    </div>
  );
}

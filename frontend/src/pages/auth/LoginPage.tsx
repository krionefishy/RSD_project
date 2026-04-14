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

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Введите email и пароль");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = Object.values(mockUsers).find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        setUser(user);
        navigate(roleRoutes[user.role]);
        toast.success(`Добро пожаловать, ${user.firstName}!`);
      } else {
        toast.error("Пользователь не найден или неверный пароль");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFC" }}>
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-10 px-6"
        style={{ background: "linear-gradient(160deg, #1A56DB 0%, #1248BA 100%)" }}
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

      <div className="flex-1 flex flex-col px-5 py-8" style={{ background: "#F8FAFC" }}>
        <h2 style={{ color: "#1E293B", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Добро пожаловать
        </h2>
        <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
          Войдите в свой аккаунт
        </p>

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
              className="w-full h-12 pl-10 pr-12 rounded-[10px] border outline-none"
              style={{
                border: "1.5px solid #E2E8F0",
                color: "#1E293B",
                background: "#fff",
                fontSize: 15,
              }}
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
          className="w-full h-12 rounded-[10px] flex items-center justify-center mt-4"
          style={{
            background: loading ? "#93AEED" : "#1A56DB",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Войти"
          )}
        </button>

        <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200">
           <p className="text-[11px] text-slate-500 font-medium mb-2 uppercase tracking-wider">Доступные аккаунты для теста:</p>
           <div className="space-y-1">
              <p className="text-xs text-slate-600">Продавец: <span className="font-mono text-blue-600">a.ivanova@rsd.ru</span></p>
              <p className="text-xs text-slate-600">Управляющий: <span className="font-mono text-blue-600">d.petrov@rsd.ru</span></p>
              <p className="text-xs text-slate-600">Основатель: <span className="font-mono text-blue-600">m.sokolov@rsd.ru</span></p>
           </div>
           <p className="text-[10px] text-slate-400 mt-2">Пароль любой</p>
        </div>

        <button className="mt-4 text-center" style={{ color: "#1A56DB", fontSize: 14, fontWeight: 500 }}>
          Забыли пароль?
        </button>

        <p className="mt-auto pt-8 text-center" style={{ color: "#94A3B8", fontSize: 12 }}>
          Используя приложение, вы соглашаетесь с{" "}
          <span style={{ color: "#1A56DB", textDecoration: "underline" }}>
            пользовательским соглашением
          </span>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { APIError } from "../../api/APIClient";
import { AuthAPI } from "../../api/AuthAPI";
import { UserAPI } from "../../api/UserAPI";
import { useApp } from "../../context/AppContext";
import { roleRoutes } from "../../utils/roleMap";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [externalSystemId, setExternalSystemId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!externalSystemId || !password) {
      toast.error("Введите ID сотрудника и пароль");
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.login(externalSystemId, password);
      const user = await UserAPI.fetchMe();
      setUser(user);
      toast.success(`Добро пожаловать, ${user.firstName}!`);
      navigate(roleRoutes[user.role] ?? "/");
    } catch (err) {
      let message = "Не удалось войти. Попробуйте ещё раз.";
      if (err instanceof APIError) {
        if (err.code === "INVALID_CREDENTIALS") {
          message = "Неверный ID сотрудника или пароль";
        } else if (err.code === "DECRYPT_FAILED") {
          message = "Ошибка шифрования пароля. Обновите страницу.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
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

        <div className="mb-4">
          <label style={{ display: "block", color: "#374151", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            ID сотрудника
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <User size={18} color="#94A3B8" />
            </div>
            <input
              type="text"
              value={externalSystemId}
              onChange={(e) => setExternalSystemId(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-[10px] border outline-none text-[15px]"
              style={{
                border: "1.5px solid #E2E8F0",
                color: "#1E293B",
                background: "#fff",
                fontSize: 15,
              }}
              placeholder="Введите ID сотрудника"
              autoComplete="username"
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  e.preventDefault();
                  void handleLogin();
                }
              }}
              className="w-full h-12 pl-10 pr-10 rounded-[10px] border outline-none"
              style={{
                border: "1.5px solid #E2E8F0",
                color: "#1E293B",
                background: "#fff",
                fontSize: 15,
              }}
              placeholder="Введите пароль"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => void handleLogin()}
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

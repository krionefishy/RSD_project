import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { APIError } from "../../api/APIClient";
import { AuthAPI } from "../../api/AuthAPI";
import { UserAPI } from "../../api/UserAPI";
import { DEMO_LOGIN_ACCOUNTS, DEMO_PASSWORD, isDemoMode } from "../../config/demoAccounts";
import { isPresentationMode } from "../../config/presentationMode";
import { useApp } from "../../context/AppContext";
import { getMockUserByExternalId } from "../../mock/mockUsers";
import { setPresentationRole } from "../../mock/presentationRoleStorage";
import { roleRoutes, toFrontendRole, type BackendRole } from "../../utils/roleMap";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [externalSystemId, setExternalSystemId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoMode();
  const presentationMode = isPresentationMode();
  const showDemoAccounts = demoMode && presentationMode;

  const completeLogin = async (id: string, pass: string) => {
    setLoading(true);
    try {
      await AuthAPI.login(id, pass);
      const user = await UserAPI.fetchMe();
      setUser(user);
      toast.success(`Добро пожаловать, ${user.firstName}!`);
      navigate(roleRoutes[user.role] ?? "/");
    } catch (err) {
      let message = "Не удалось войти. Попробуйте ещё раз.";
      if (err instanceof APIError) {
        if (err.code === "INVALID_CREDENTIALS") {
          message = "Неверный ID сотрудника или пароль";
        } else if (err.code === "ACCOUNT_INACTIVE") {
          message = "Ваш аккаунт заблокирован. Обратитесь к администратору.";
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

  const handlePresentationLogin = async (account: (typeof DEMO_LOGIN_ACCOUNTS)[0]) => {
    const role = toFrontendRole((account.roleHint ?? "seller") as BackendRole);
    setPresentationRole(role);
    const mockUser = getMockUserByExternalId(account.externalSystemId);
    setLoading(true);
    try {
      await AuthAPI.login(account.externalSystemId, DEMO_PASSWORD);
      setUser(mockUser);
      toast.success(`Демо: ${account.label}`);
      navigate(roleRoutes[role] ?? "/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (id: string) => {
    setExternalSystemId(id);
    setPassword(DEMO_PASSWORD);
  };

  const handleLogin = async () => {
    if (!externalSystemId || !password) {
      toast.error("Введите ID сотрудника и пароль");
      return;
    }
    await completeLogin(externalSystemId, password);
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
          {presentationMode ? "Выберите роль для просмотра демо" : "Войдите в свой аккаунт"}
        </p>

        {!presentationMode && (
          <>
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
          </>
        )}

        {showDemoAccounts && (
          <div
            className={`rounded-[12px] border px-4 py-4 ${presentationMode ? "" : "mt-6"}`}
            style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}
          >
            <p style={{ color: "#166534", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              Демо-вход
            </p>
            {!presentationMode && (
              <p style={{ color: "#15803D", fontSize: 12, marginBottom: 12 }}>
                Пароль для всех аккаунтов: <span style={{ fontFamily: "monospace" }}>{DEMO_PASSWORD}</span>
              </p>
            )}
            <div className="flex flex-col gap-2">
              {DEMO_LOGIN_ACCOUNTS.map((account) => (
                <button
                  key={account.externalSystemId}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    presentationMode
                      ? void handlePresentationLogin(account)
                      : fillDemoAccount(account.externalSystemId)
                  }
                  className="w-full rounded-[8px] px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: "#fff",
                    border: "1px solid #DCFCE7",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: "#14532D", fontSize: 13, fontWeight: 600 }}>{account.label}</span>
                    {!presentationMode && (
                      <span
                        style={{
                          color: "#64748B",
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                      >
                        {account.externalSystemId}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p style={{ color: "#86EFAC", fontSize: 11, marginTop: 10 }}>
              {presentationMode
                ? "Нажмите на роль — откроется интерфейс с демо-данными"
                : "Нажмите на роль, чтобы подставить ID и пароль, затем «Войти»"}
            </p>
          </div>
        )}

        {!presentationMode && (
          <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 16, textAlign: "center" }}>
            Забыли пароль? Обратитесь к администратору
          </p>
        )}
      </div>
    </div>
  );
}

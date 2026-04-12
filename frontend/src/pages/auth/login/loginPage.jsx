import { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "../../../components/button/button";
import { Input } from "../../../components/input/input";
import { Loader } from "../../../components/loader/loader";
import AuthAPI from "../../../api/AuthAPI";
import { fetchUserInfo, fetchUserStatus } from "../../../features/user/slice";
import styles from "./loginPage.module.css";

export const LoginPage = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Введите email и пароль");
      return;
    }

    setLoading(true);

    try {
      await AuthAPI.login(email, password);
      // Fetch user data after successful login
      await dispatch(fetchUserStatus()).unwrap();
      await dispatch(fetchUserInfo()).unwrap();
      // Navigate will happen automatically via App component
    } catch (err) {
      setError("Ошибка входа. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <div className={styles.logoCircle}>RSD</div>
      </div>
      <h1 className={styles.title}>Вход в систему</h1>
      <p className={styles.subtitle}>Обучение персонала</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="email"
          name="email"
          label="Email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          name="password"
          label="Пароль"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={loading}
        >
          {loading ? <Loader size="small" /> : "Войти"}
        </Button>
      </form>

      <p className={styles.hint}>
        Для демо введите любой email и пароль
      </p>
    </div>
  );
};

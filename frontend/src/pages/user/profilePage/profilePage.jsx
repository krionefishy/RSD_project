import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Header } from "../../../components/header/header";
import { Button } from "../../../components/button/button";
import { Input } from "../../../components/input/input";
import { ProgressBar } from "../../../components/progressBar/progressBar";
import { Loader } from "../../../components/loader/loader";
import { StarIcon, TrophyIcon, MedalIcon } from "../../../assets/icons";
import UserAPI from "../../../api/UserAPI";
import AuthAPI from "../../../api/AuthAPI";
import { clearAuthSession } from "../../../utils/authStorage";
import { clearUser, updateUserField } from "../../../features/user/slice";
import { useAnimatedNavigate } from "../../../hooks/useAnimatedNavigate";
import styles from "./profilePage.module.css";

export const ProfilePage = () => {
  const navigate = useAnimatedNavigate();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userData);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userData?.name || "");
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  // Load achievements
  useState(() => {
    const loadAchievements = async () => {
      try {
        const data = await UserAPI.fetchUserAchieves();
        setAchievements(data);
      } finally {
        setAchievementsLoading(false);
      }
    };
    loadAchievements();
  });

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await UserAPI.updateUserInfo(userData.userId, { name });
      dispatch(updateUserField({ name }));
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthAPI.logout();
    clearAuthSession();
    dispatch(clearUser());
    navigate("/auth/login");
  };

  const getLevelProgress = () => {
    // Mock level progression: level 3 needs 2000 exp total
    const levelThresholds = [0, 500, 1000, 2000, 3500, 5000];
    const currentLevel = userData?.level || 1;
    const currentExp = userData?.totalExp || 0;
    const levelBase = levelThresholds[currentLevel - 1] || 0;
    const levelNext = levelThresholds[currentLevel] || currentExp + 1000;
    const progress = currentExp - levelBase;
    const max = levelNext - levelBase;
    return { progress, max, currentLevel };
  };

  const levelInfo = getLevelProgress();

  return (
    <div className={styles.container}>
      <Header title="Профиль" />

      <div className={styles.content}>
        {/* User Card */}
        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {userData?.profilePhotoUrl ? (
                <img src={userData.profilePhotoUrl} alt={userData.name} />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {userData?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className={styles.levelBadge}>
              <span>Ур. {levelInfo.currentLevel}</span>
            </div>
          </div>

          <div className={styles.info}>
            {editing ? (
              <div className={styles.editSection}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  label="Имя"
                />
                <div className={styles.editButtons}>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => {
                      setName(userData?.name || "");
                      setEditing(false);
                    }}
                  >
                    Отмена
                  </Button>
                  <Button size="small" onClick={handleSaveName} disabled={loading}>
                    {loading ? <Loader size="small" /> : "Сохранить"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className={styles.name}>{userData?.name || "Пользователь"}</h2>
                <p className={styles.email}>{userData?.email}</p>
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className={styles.editButton}
                >
                  Редактировать
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Level Progress */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Прогресс уровня</h3>
          <div className={styles.levelProgress}>
            <div className={styles.levelInfo}>
              <span>Уровень {levelInfo.currentLevel}</span>
              <span>
                {userData?.totalExp || 0} / {levelInfo.levelBase + levelInfo.max} XP
              </span>
            </div>
            <ProgressBar
              progress={levelInfo.progress}
              max={levelInfo.max}
              showLabel={false}
              size="large"
            />
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <StarIcon />
            <span className={styles.statValue}>{userData?.totalExp || 0}</span>
            <span className={styles.statLabel}>Опыт</span>
          </div>
          <div className={styles.statCard}>
            <TrophyIcon />
            <span className={styles.statValue}>3</span>
            <span className={styles.statLabel}>Курса пройдено</span>
          </div>
          <div className={styles.statCard}>
            <MedalIcon />
            <span className={styles.statValue}>2</span>
            <span className={styles.statLabel}>Достижения</span>
          </div>
        </div>

        {/* Achievements */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Достижения</h3>
          {achievementsLoading ? (
            <Loader />
          ) : achievements.length > 0 ? (
            <div className={styles.achievementsList}>
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`${styles.achievement} ${
                    ach.earned ? styles.earned : styles.locked
                  }`}
                >
                  <div className={styles.achievementIcon}>{ach.icon}</div>
                  <div className={styles.achievementInfo}>
                    <span className={styles.achievementName}>{ach.name}</span>
                    <span className={styles.achievementDesc}>
                      {ach.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Пока нет достижений</p>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          fullWidth
          onClick={handleLogout}
          className={styles.logoutButton}
        >
          Выйти
        </Button>
      </div>
    </div>
  );
};

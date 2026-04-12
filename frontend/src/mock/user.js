export const mockCurrentUser = {
  userId: 1,
  name: "Иван Петров",
  email: "ivan.petrov@example.com",
  level: 3,
  totalExp: 1250,
  profilePhotoUrl: null,
  cafeId: 1,
  isActive: true,
  is2faEnabled: false,
};

export const mockUserStatus = {
  isUser: true,
  isAdmin: false,
  isSuperAdmin: false,
};

export const mockAchievements = [
  { id: 1, name: "Первые шаги", description: "Пройдите первый курс", icon: "star", earned: true },
  { id: 2, name: "Знаток", description: "Наберите 1000 очков", icon: "trophy", earned: true },
  { id: 3, name: "Эксперт", description: "Пройдите 5 курсов", icon: "crown", earned: false },
];

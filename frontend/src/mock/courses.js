export const mockCourses = [
  {
    id: 1,
    name: "Бариста: основы",
    description: "Базовый курс для бариста. Изучите основы приготовления кофе, работы с оборудованием и обслуживания клиентов.",
    rating_points: 100,
    mrp: 70,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Латте-арт для начинающих",
    description: "Научитесь создавать красивые узоры на кофе. От сердечек до сложных розетт.",
    rating_points: 150,
    mrp: 100,
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: 3,
    name: "Кассовые операции",
    description: "Полный курс по работе с кассой: прием заказов, оплата, возвраты, закрытие смены.",
    rating_points: 80,
    mrp: 60,
    created_at: "2024-02-15T10:00:00Z",
  },
  {
    id: 4,
    name: "Обслуживание клиентов",
    description: "Как эффективно общаться с гостями, решать конфликты и повышать лояльность.",
    rating_points: 120,
    mrp: 90,
    created_at: "2024-03-01T10:00:00Z",
  },
];

export const mockCourseMaterials = {
  1: [1, 2, 3], // Course 1 has materials 1, 2, 3
  2: [4, 5],    // Course 2 has materials 4, 5
  3: [6, 7, 8], // Course 3 has materials 6, 7, 8
  4: [9, 10],   // Course 4 has materials 9, 10
};

export const mockCourseTests = {
  1: [1, 2],    // Course 1 has tests 1, 2
  2: [3],       // Course 2 has test 3
  3: [4, 5],    // Course 3 has tests 4, 5
  4: [6],       // Course 4 has test 6
};

export const mockUserCourseProgress = {
  1: {
    course_id: 1,
    user_points_by_course: 85,
    is_course_completed: true,
    is_course_completed_successfully: true,
    materials_completed: [1, 2],
    tests_completed: [1],
  },
  2: {
    course_id: 2,
    user_points_by_course: 0,
    is_course_completed: false,
    is_course_completed_successfully: false,
    materials_completed: [],
    tests_completed: [],
  },
};

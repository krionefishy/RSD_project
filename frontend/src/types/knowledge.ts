export interface CourseListItem {
  id: number;
  name: string;
  description: string | null;
  materialsCount: number;
  testsCount: number;
}

export interface CourseMaterialItem {
  id: number;
  materialId: number;
  name: string;
  category: string;
  description: string | null;
  isCompleted: boolean;
}

export interface CourseTestItem {
  id: number;
  testId: number;
  name: string;
  category: string;
  isFinal: boolean;
  tasksCount: number;
  isPassed: boolean;
  score: number | null;
}

export interface Course {
  id: number;
  name: string;
  description: string | null;
  ratingPoints: number;
  mrp: number;
  materialsCount: number;
  testsCount: number;
  createdAt: string;
  materials: CourseMaterialItem[];
  tests: CourseTestItem[];
  userPointsByCourse: number | null;
  isCourseCompleted: boolean | null;
}

export interface MaterialAttachment {
  id: number;
  name: string;
  format: string;
}

export interface MaterialAttachmentLink {
  attachmentId: number;
  url: string;
}

export interface Material {
  id: number;
  name: string;
  category: string;
  description: string | null;
  text: string;
  attachments: MaterialAttachment[];
  courseId: number;
  createdAt: string;
}

export interface TestTask {
  id: number;
  name: string;
  description: string | null;
  points: number;
  answerVariants: string[];
}

export interface TestTaskAdmin extends TestTask {
  correctVariant: number;
}

export interface CourseEnrollment {
  userId: string;
  name: string;
  progress: number;
  isCompleted: boolean;
}

export interface Test {
  id: number;
  name: string;
  category: string;
  description: string | null;
  isFinal: boolean;
  passScorePercent: number;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  tasksCount: number;
  totalPoints: number;
  courseId: number;
  createdAt: string;
}

export interface StartTestResult {
  testId: number;
  testName: string;
  tasksCount: number;
  firstTask: TestTask;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  nextTask: TestTask | null;
  isTestCompleted: boolean;
}

export interface TestResult {
  testId: number;
  testName: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
}

export interface CompleteMaterialResult {
  materialId: number;
  courseId: number;
}

export interface CompleteCourseResult {
  courseId: number;
  completed: boolean;
  message: string;
  completedMaterials: number;
  totalMaterials: number;
  passedTests: number;
  totalTests: number;
  userPoints: number;
  requiredPoints: number;
}

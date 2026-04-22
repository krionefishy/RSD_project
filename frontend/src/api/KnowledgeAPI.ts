import {
  CompleteCourseResult,
  CompleteMaterialResult,
  Course,
  CourseListItem,
  CourseMaterialItem,
  CourseTestItem,
  Material,
  MaterialAttachment,
  StartTestResult,
  SubmitAnswerResult,
  TestResult,
  TestTask,
} from "../types/knowledge";
import { apiClient } from "./APIClient";

interface CourseListItemDTO {
  id: number;
  name: string;
  description: string | null;
  materials_count: number;
  tests_count: number;
}

interface CoursesListDTO {
  items: CourseListItemDTO[];
}

interface CourseMaterialItemDTO {
  id: number;
  material_id: number;
  name: string;
  category: string;
  description: string | null;
  is_completed: boolean;
}

interface CourseTestItemDTO {
  id: number;
  test_id: number;
  name: string;
  category: string;
  is_final: boolean;
  tasks_count: number;
  is_passed: boolean;
  score: number | null;
}

interface CourseDTO {
  id: number;
  name: string;
  description: string | null;
  rating_points: number;
  mrp: number;
  materials_count: number;
  tests_count: number;
  created_at: string;
  materials: CourseMaterialItemDTO[];
  tests: CourseTestItemDTO[];
  user_points_by_course: number | null;
  is_course_completed: boolean | null;
}

interface MaterialAttachmentDTO {
  id: number;
  name: string;
  format: string;
}

interface MaterialDTO {
  id: number;
  name: string;
  category: string;
  description: string | null;
  text: string;
  attachments: MaterialAttachmentDTO[];
  course_id: number;
  created_at: string;
}

interface TestTaskDTO {
  id: number;
  name: string;
  description: string | null;
  points: number;
  answer_variants: string[];
}

interface StartTestResultDTO {
  test_id: number;
  test_name: string;
  tasks_count: number;
  first_task: TestTaskDTO;
}

interface SubmitAnswerResultDTO {
  is_correct: boolean;
  points_earned: number;
  next_task: TestTaskDTO | null;
  is_test_completed: boolean;
}

interface TestResultDTO {
  test_id: number;
  test_name: string;
  score: number;
  max_score: number;
  percentage: number;
  is_passed: boolean;
}

interface CompleteMaterialResultDTO {
  material_id: number;
  course_id: number;
}

interface CompleteCourseResultDTO {
  course_id: number;
  completed: boolean;
  message: string;
  completed_materials: number;
  total_materials: number;
  passed_tests: number;
  total_tests: number;
  user_points: number;
  required_points: number;
}

function mapCompleteCourseResult(dto: CompleteCourseResultDTO): CompleteCourseResult {
  return {
    courseId: dto.course_id,
    completed: dto.completed,
    message: dto.message,
    completedMaterials: dto.completed_materials,
    totalMaterials: dto.total_materials,
    passedTests: dto.passed_tests,
    totalTests: dto.total_tests,
    userPoints: dto.user_points,
    requiredPoints: dto.required_points,
  };
}

function mapCourseItem(dto: CourseListItemDTO): CourseListItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    materialsCount: dto.materials_count,
    testsCount: dto.tests_count,
  };
}

function mapCourseMaterialItem(dto: CourseMaterialItemDTO): CourseMaterialItem {
  return {
    id: dto.id,
    materialId: dto.material_id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    isCompleted: dto.is_completed,
  };
}

function mapCourseTestItem(dto: CourseTestItemDTO): CourseTestItem {
  return {
    id: dto.id,
    testId: dto.test_id,
    name: dto.name,
    category: dto.category,
    isFinal: dto.is_final,
    tasksCount: dto.tasks_count,
    isPassed: dto.is_passed,
    score: dto.score,
  };
}

function mapCourse(dto: CourseDTO): Course {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    ratingPoints: dto.rating_points,
    mrp: dto.mrp,
    materialsCount: dto.materials_count,
    testsCount: dto.tests_count,
    createdAt: dto.created_at,
    materials: dto.materials.map(mapCourseMaterialItem),
    tests: dto.tests.map(mapCourseTestItem),
    userPointsByCourse: dto.user_points_by_course,
    isCourseCompleted: dto.is_course_completed,
  };
}

function mapAttachment(dto: MaterialAttachmentDTO): MaterialAttachment {
  return { id: dto.id, name: dto.name, format: dto.format };
}

function mapMaterial(dto: MaterialDTO): Material {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    text: dto.text,
    attachments: dto.attachments.map(mapAttachment),
    courseId: dto.course_id,
    createdAt: dto.created_at,
  };
}

function mapTask(dto: TestTaskDTO): TestTask {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    points: dto.points,
    answerVariants: dto.answer_variants,
  };
}

class KnowledgeAPIImpl {
  async listCourses(): Promise<CourseListItem[]> {
    const response = await apiClient.get<CoursesListDTO>("/kb/courses/");
    return response.items.map(mapCourseItem);
  }

  async getCourse(courseId: number): Promise<Course> {
    const response = await apiClient.get<CourseDTO>(`/kb/courses/${courseId}`);
    return mapCourse(response);
  }

  async getMaterial(materialId: number, courseId: number): Promise<Material> {
    const response = await apiClient.get<MaterialDTO>(`/kb/materials/${materialId}`, {
      query: { course_id: courseId },
    });
    return mapMaterial(response);
  }

  async completeMaterial(courseId: number, materialId: number): Promise<CompleteMaterialResult> {
    const response = await apiClient.post<CompleteMaterialResultDTO>("/kb/materials/complete", {
      course_id: courseId,
      material_id: materialId,
    });
    return { materialId: response.material_id, courseId: response.course_id };
  }

  async startTest(courseId: number, testId: number): Promise<StartTestResult> {
    const response = await apiClient.post<StartTestResultDTO>("/kb/tests/start", {
      course_id: courseId,
      test_id: testId,
    });
    return {
      testId: response.test_id,
      testName: response.test_name,
      tasksCount: response.tasks_count,
      firstTask: mapTask(response.first_task),
    };
  }

  async submitAnswer(
    courseId: number,
    testId: number,
    taskId: number,
    selectedVariant: number,
  ): Promise<SubmitAnswerResult> {
    const response = await apiClient.post<SubmitAnswerResultDTO>("/kb/tests/submit-answer", {
      course_id: courseId,
      test_id: testId,
      task_id: taskId,
      selected_variant: selectedVariant,
    });
    return {
      isCorrect: response.is_correct,
      pointsEarned: response.points_earned,
      nextTask: response.next_task ? mapTask(response.next_task) : null,
      isTestCompleted: response.is_test_completed,
    };
  }

  async getTestResult(testId: number, courseId: number): Promise<TestResult> {
    const response = await apiClient.get<TestResultDTO>(`/kb/tests/${testId}/result`, {
      query: { course_id: courseId },
    });
    return {
      testId: response.test_id,
      testName: response.test_name,
      score: response.score,
      maxScore: response.max_score,
      percentage: response.percentage,
      isPassed: response.is_passed,
    };
  }

  async completeCourse(courseId: number): Promise<CompleteCourseResult> {
    const response = await apiClient.post<CompleteCourseResultDTO>("/kb/courses/complete", {
      course_id: courseId,
    });
    return mapCompleteCourseResult(response);
  }
}

export const KnowledgeAPI = new KnowledgeAPIImpl();

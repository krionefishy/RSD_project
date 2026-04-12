import {
  mockCourses,
  mockCourseMaterials,
  mockCourseTests,
  mockUserCourseProgress,
} from "../mock/courses";
import { mockMaterials, mockUserMaterialsProgress } from "../mock/materials";
import {
  mockTests,
  mockTasks,
  mockUserTestsProgress,
} from "../mock/tests";

// Mock API for knowledge base operations (no backend connection)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class KnowledgeAPIClass {
  // Courses
  async fetchCourses() {
    await delay(400);
    return mockCourses.map((course) => ({
      ...course,
      progress: mockUserCourseProgress[course.id] || null,
    }));
  }

  async fetchCourse(courseId) {
    await delay(300);
    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) throw new Error("Course not found");
    return {
      ...course,
      progress: mockUserCourseProgress[courseId] || null,
    };
  }

  async fetchCourseMaterials(courseId) {
    await delay(300);
    const materialIds = mockCourseMaterials[courseId] || [];
    return materialIds.map((id) => {
      const material = mockMaterials.find((m) => m.material_id === id);
      const progress = mockUserMaterialsProgress[id];
      return {
        ...material,
        is_completed: progress?.is_completed || false,
      };
    });
  }

  async fetchCourseTests(courseId) {
    await delay(300);
    const testIds = mockCourseTests[courseId] || [];
    return testIds.map((id) => {
      const test = mockTests.find((t) => t.test_id === id);
      const progress = mockUserTestsProgress[id];
      return {
        ...test,
        is_completed: progress?.is_completed || false,
        is_successful: progress?.is_successful || false,
        score: progress?.score || 0,
        max_score: test.tasks.reduce((sum, taskId) => sum + mockTasks[taskId].points, 0),
      };
    });
  }

  // Materials
  async fetchMaterial(materialId) {
    await delay(300);
    const material = mockMaterials.find((m) => m.material_id === materialId);
    if (!material) throw new Error("Material not found");
    return { ...material };
  }

  async completeMaterial(materialId) {
    await delay(300);
    mockUserMaterialsProgress[materialId] = { material_id: materialId, is_completed: true };
    return { success: true };
  }

  // Tests
  async fetchTest(testId) {
    await delay(300);
    const test = mockTests.find((t) => t.test_id === testId);
    if (!test) throw new Error("Test not found");
    return { ...test };
  }

  async fetchTestTasks(testId) {
    await delay(300);
    const test = mockTests.find((t) => t.test_id === testId);
    if (!test) throw new Error("Test not found");
    return test.tasks.map((taskId) => mockTasks[taskId]);
  }

  async submitTaskAnswer(testId, taskId, answerVariantId) {
    await delay(500);
    const task = mockTasks[taskId];
    const isCorrect = task.correct_variant === answerVariantId;
    return {
      is_correct: isCorrect,
      correct_variant: task.correct_variant,
      points_earned: isCorrect ? task.points : 0,
    };
  }

  async completeTest(testId, score) {
    await delay(400);
    const test = mockTests.find((t) => t.test_id === testId);
    const maxScore = test.tasks.reduce((sum, taskId) => sum + mockTasks[taskId].points, 0);
    const isSuccessful = score >= maxScore * 0.7; // 70% to pass

    mockUserTestsProgress[testId] = {
      test_id: testId,
      is_completed: true,
      is_successful: isSuccessful,
      score: score,
      max_score: maxScore,
    };

    return {
      success: true,
      is_successful: isSuccessful,
      score: score,
      max_score: maxScore,
    };
  }
}

const KnowledgeAPI = new KnowledgeAPIClass();
export default KnowledgeAPI;

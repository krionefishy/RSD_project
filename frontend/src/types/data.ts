export interface Material {
  id: string;
  sectionId?: string;
  courseId?: string;
  category?: string;
  title: string;
  type: "text" | "video" | "document";
  duration: string;
  status: "done" | "in-progress" | "not-started";
  progress: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  materialsCount: number;
  testsCount: number;
  categories: string[];
  duration: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
  isRequired: boolean;
  assignedAt?: string;
  completedAt?: string;
}

export interface KnowledgeSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  count: number;
  progress: number;
}

export interface Test {
  id: string;
  sectionId?: string;
  courseId?: string;
  title: string;
  questionsCount: number;
  status: "passed" | "assigned" | "repeat" | "not-assigned";
  score?: number;
  deadline?: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

export interface SalesData {
  plan: number;
  fact: number;
  percent: number;
  bonus: number;
  chart: Array<{ day: string; plan: number; fact: number }>;
  positions: Array<{ name: string; plan: number; fact: number }>;
}

export interface RatingItem {
  rank: number;
  name: string;
  store: string;
  value: string;
  isMe: boolean;
}

export interface RatingData {
  sales: {
    myPosition: number;
    change: number;
    myValue: string;
    total: number;
    list: RatingItem[];
  };
  learning: {
    myPosition: number;
    change: number;
    myValue: string;
    total: number;
    list: RatingItem[];
  };
}

export interface ScheduleDay {
  date: number;
  type: "work" | "off" | "vacation" | "sick";
  shift?: string;
}

export interface ManagerStore {
  id: string;
  name: string;
  plan: number;
  fact: number;
  percent: number;
  employees: number;
}

export interface ManagerEmployee {
  id: string;
  name: string;
  store: string;
  position: string;
  salesPercent: number;
  learningPercent: number;
  status: "work" | "off" | "vacation" | "sick";
}

export interface NetworkBlock {
  id: string;
  name: string;
  stores: number;
  employees: number;
  salesPercent: number;
}

export interface Account {
  id: string;
  name: string;
  externalSystemId: string;
  role: string;
  roleLabel: string;
  status: "active" | "blocked";
}

export interface TimesheetUpload {
  id: string;
  period: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  employeesCount: number;
  status: "processed" | "processing" | "error";
}

export interface Assignment {
  id: string;
  testTitle: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  deadline: string;
  status: "in-progress" | "completed" | "overdue";
  score?: number;
}

export interface LearningReport {
  sectionName: string;
  avgProgress: number;
  assignedCount: number;
  completedCount: number;
}

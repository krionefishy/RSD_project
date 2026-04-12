export const APP_NAME = "RSD";
export const APP_VERSION = "0.1.0";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

export const KNOWLEDGE_BASE_CATEGORIES = {
  COURSE: "course",
  MATERIAL: "material",
  TEST: "test",
};

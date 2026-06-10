import CourseEnrollmentsPage from "../../admin-edu/CourseEnrollmentsPage";

/** Wrapped by route; CourseEnrollmentsPage detects /admin-po path for back link. */
export default function AdminPOCourseEnrollmentsPreviewPage() {
  return <CourseEnrollmentsPage />;
}

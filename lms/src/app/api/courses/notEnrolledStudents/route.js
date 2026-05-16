import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId) {
      return new Response(
        JSON.stringify({
          error: "NO_COURSE_SELECTED",
          message: "Please select a course first",
        }),
        { status: 400 }
      );
    }

    const students = await query(
      `SELECT s.student_id, s.student_name, s.class, s.account_id
       FROM student s
       WHERE NOT EXISTS (
         SELECT 1 FROM enrollment e
         WHERE e.course_id = ? AND e.student_id = s.student_id
       )`,
      [courseId]
    );

    return new Response(JSON.stringify(students), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "DATABASE_ERROR",
        message: error.message,
      }),
      { status: 500 }
    );
  }
}

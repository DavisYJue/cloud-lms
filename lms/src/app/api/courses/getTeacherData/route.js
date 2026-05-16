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

    const teachers = await query(
      `SELECT t.teacher_id, t.teacher_name, t.faculty, t.account_id, e.enrollment_date
       FROM teacher t
       JOIN otherenrollment e ON t.account_id = e.account_id
       WHERE e.course_id = ? AND e.status = 'active'`,
      [courseId]
    );

    return new Response(JSON.stringify({ teachers }), {
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

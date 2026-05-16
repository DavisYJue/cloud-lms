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

    const assistants = await query(
      `SELECT a.assistant_id, a.assistant_name, a.department, a.account_id
       FROM assistant a
       WHERE NOT EXISTS (
         SELECT 1 FROM otherenrollment e
         WHERE e.course_id = ? AND e.account_id = a.account_id
       )`,
      [courseId]
    );

    return new Response(JSON.stringify(assistants), {
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

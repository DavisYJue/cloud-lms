import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;

  if (!courseId) {
    return new Response(JSON.stringify({ error: "Course ID not found" }), {
      status: 400,
    });
  }

  try {
    const results = await query(
      `SELECT a.assistant_id, a.assistant_name, a.department 
       FROM teaching_assistant ta
       JOIN assistant a ON ta.assistant_id = a.assistant_id
       WHERE ta.course_id = ?`,
      [courseId]
    );

    return new Response(JSON.stringify(results), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

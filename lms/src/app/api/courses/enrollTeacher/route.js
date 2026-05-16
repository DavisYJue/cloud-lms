import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { teacher_id } = await request.json();
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;
    if (!courseId || !teacher_id) {
      return new Response(
        JSON.stringify({
          error: "MISSING_DATA",
          message: "Required data missing",
        }),
        { status: 400 }
      );
    }

    const [t] = await query(
      "SELECT account_id FROM teacher WHERE teacher_id = ?",
      [teacher_id]
    );
    if (!t) {
      return new Response(
        JSON.stringify({ error: "NOT_FOUND", message: "Teacher not found" }),
        { status: 404 }
      );
    }

    await query(
      `INSERT INTO otherenrollment 
         (account_id, course_id, enrollment_date, status)
       VALUES (?, ?, NOW(), 'active')`,
      [t.account_id, courseId]
    );

    const [newTeacher] = await query(
      `SELECT teacher_id, account_id, teacher_name, faculty
       FROM teacher
       WHERE teacher_id = ?`,
      [teacher_id]
    );
    return new Response(JSON.stringify(newTeacher), { status: 201 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "DATABASE_ERROR", message: err.message }),
      { status: 500 }
    );
  }
}

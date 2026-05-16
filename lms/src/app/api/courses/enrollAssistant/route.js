import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { assistant_id } = await request.json();
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;
    if (!courseId || !assistant_id) {
      return new Response(
        JSON.stringify({
          error: "MISSING_DATA",
          message: "Required data missing",
        }),
        { status: 400 }
      );
    }

    const [a] = await query(
      "SELECT account_id FROM assistant WHERE assistant_id = ?",
      [assistant_id]
    );
    if (!a) {
      return new Response(
        JSON.stringify({ error: "NOT_FOUND", message: "Assistant not found" }),
        { status: 404 }
      );
    }

    await query(
      `INSERT INTO otherenrollment 
         (account_id, course_id, enrollment_date, status)
       VALUES (?, ?, NOW(), 'active')`,
      [a.account_id, courseId]
    );

    const [newAssistant] = await query(
      `SELECT assistant_id, account_id, assistant_name, department
       FROM assistant
       WHERE assistant_id = ?`,
      [assistant_id]
    );
    return new Response(JSON.stringify(newAssistant), { status: 201 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "DATABASE_ERROR", message: err.message }),
      { status: 500 }
    );
  }
}

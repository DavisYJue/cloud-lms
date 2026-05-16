import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function DELETE(request) {
  try {
    const { student_id } = await request.json();
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId || !student_id) {
      return new Response(
        JSON.stringify({
          error: "MISSING_DATA",
          message: "Required data missing",
        }),
        { status: 400 }
      );
    }

    await query(
      `DELETE FROM enrollment 
       WHERE student_id = ? AND course_id = ?`,
      [student_id, courseId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student removed successfully",
      }),
      { status: 200 }
    );
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

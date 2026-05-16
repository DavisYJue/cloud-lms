import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function DELETE(request) {
  try {
    const { accountId, role } = await request.json();
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId || !accountId || !role) {
      return NextResponse.json(
        { error: "MISSING_DATA", message: "Required data missing" },
        { status: 400 }
      );
    }

    let result;
    switch (role) {
      case "Student":
        const [student] = await query(
          "SELECT student_id FROM student WHERE account_id = ?",
          [accountId]
        );
        if (!student) throw new Error("Student not found");

        result = await query(
          `DELETE FROM enrollment 
           WHERE account_id = ? AND course_id = ?`,
          [accountId, courseId]
        );
        if (result.affectedRows === 0) {
          throw new Error("No enrollment found for this student in the course");
        }
        break;

      case "Teacher":
        const [teacher] = await query(
          "SELECT teacher_id FROM teacher WHERE account_id = ?",
          [accountId]
        );
        if (!teacher) throw new Error("Teacher not found");

        result = await query(
          `DELETE FROM otherenrollment 
           WHERE account_id = ? AND course_id = ?`,
          [accountId, courseId]
        );
        if (result.affectedRows === 0) {
          throw new Error("No teacher found for this course");
        }
        break;

      case "Assistant":
        const [assistant] = await query(
          "SELECT assistant_id FROM assistant WHERE account_id = ?",
          [accountId]
        );
        if (!assistant) throw new Error("Assistant not found");

        result = await query(
          `DELETE FROM otherenrollment 
           WHERE account_id = ? AND course_id = ?`,
          [accountId, courseId]
        );
        if (result.affectedRows === 0) {
          throw new Error("No assistant found for this course");
        }
        break;

      default:
        return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${role} removed successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

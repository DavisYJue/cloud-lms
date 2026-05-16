import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { accountId } = await request.json();
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId || !accountId) {
      return NextResponse.json(
        { error: "MISSING_DATA", message: "Required data missing" },
        { status: 400 }
      );
    }

    const [stu] = await query(
      "SELECT student_id FROM student WHERE account_id = ?",
      [accountId]
    );
    if (!stu) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Student account not found" },
        { status: 404 }
      );
    }

    const [existing] = await query(
      "SELECT enrollment_id FROM enrollment WHERE student_id = ? AND course_id = ?",
      [stu.student_id, courseId]
    );
    if (existing) {
      return NextResponse.json(
        { error: "DUPLICATE_ENROLLMENT", message: "Already enrolled" },
        { status: 409 }
      );
    }

    await query(
      `INSERT INTO enrollment 
         (student_id, course_id, enrollment_date, status, account_id)
       VALUES (?, ?, NOW(), 'active', ?)`,
      [stu.student_id, courseId, accountId]
    );

    const [newStudent] = await query(
      `SELECT 
         student_id,
         account_id,
         student_name,
         class
       FROM student
       WHERE student_id = ?`,
      [stu.student_id]
    );

    return NextResponse.json(newStudent, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "DATABASE_ERROR", message: err.message },
      { status: 500 }
    );
  }
}

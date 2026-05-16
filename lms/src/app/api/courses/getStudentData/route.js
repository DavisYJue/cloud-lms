import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId) {
      return NextResponse.json(
        { message: "No course selected - please select a course first" },
        { status: 400 }
      );
    }

    const studentData = await query(
      `
      SELECT 
        s.student_id,
        s.student_name,
        s.class,
        e.enrollment_id,
        e.enrollment_date,
        e.status,
        e.account_id
      FROM 
        enrollment e
      JOIN 
        student s ON e.student_id = s.student_id
      WHERE 
        e.course_id = ?
      ORDER BY 
        s.student_name ASC
    `,
      [courseId]
    );

    return NextResponse.json(
      {
        students: studentData,
        count: studentData.length,
        courseId: courseId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching student data:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch student data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;

    if (!courseId) {
      return NextResponse.json(
        { message: "No course selected" },
        { status: 404 }
      );
    }

    const course = await query(
      `SELECT 
        course_id,
        course_title,
        course_image,
        course_duration,
        course_description,
        course_type,
        start_date,
        end_date,
        teacher_id
       FROM course 
       WHERE course_id = ?`,
      [courseId]
    );

    if (course.length === 0) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

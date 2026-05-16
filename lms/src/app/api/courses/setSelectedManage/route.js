import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";

export async function POST(request) {
  try {
    const { courseId } = await request.json();

    const course = await query(
      "SELECT course_id FROM course WHERE course_id = ?",
      [courseId]
    );

    if (course.length === 0) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("selectedCourseId", courseId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
      path: "/",
    });

    return NextResponse.json({ message: "Course selected" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function POST(request) {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;
  const { assistantId } = await request.json();

  if (!courseId) {
    return new Response(JSON.stringify({ error: "Course ID not found" }), {
      status: 400,
    });
  }

  try {
    await query(
      `INSERT INTO teaching_assistant (assistant_id, course_id, assigned_at)
       VALUES (?, ?, NOW())`,
      [assistantId, courseId]
    );

    return new Response(
      JSON.stringify({ message: "Assistant added successfully" }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get("assistantId");

  if (!courseId) {
    return new Response(JSON.stringify({ error: "Course ID not found" }), {
      status: 400,
    });
  }

  try {
    await query(
      `DELETE FROM teaching_assistant 
       WHERE assistant_id = ? AND course_id = ?`,
      [assistantId, courseId]
    );

    return new Response(
      JSON.stringify({ message: "Assistant removed successfully" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

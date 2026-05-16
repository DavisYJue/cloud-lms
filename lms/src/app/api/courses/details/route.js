import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      console.log("No session cookie found.");
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const courseId = session.selected_course_id;
    const accountId = session.account_id;

    if (!courseId) {
      console.log("No course ID in session.");
      return Response.json({ error: "No course selected" }, { status: 400 });
    }

    const [course] = await query(`SELECT * FROM course WHERE course_id = ?`, [
      courseId,
    ]);
    if (!course) {
      console.log("No course found with the provided ID.");
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    const assignments = await query(
      `SELECT * FROM assignment WHERE course_id = ?`,
      [courseId]
    );
    const materials = await query(
      `SELECT * FROM material WHERE course_id = ?`,
      [courseId]
    );

    const [user] = await query(
      `SELECT account_id, username, email, telephone, address, bio, role
       FROM Account 
       WHERE account_id = ?`,
      [accountId]
    );

    const [student] = await query(
      `SELECT student_id FROM student WHERE account_id = ?`,
      [accountId]
    );
    const isStudent = !!student?.student_id;

    for (const assignment of assignments) {
      const files = await query(
        `SELECT * FROM assignment_material WHERE assignment_id = ?`,
        [assignment.assignment_id]
      );
      assignment.materials = files;

      if (isStudent) {
        const [submission] = await query(
          `SELECT * FROM submission 
           WHERE assignment_id = ? AND student_id = ?`,
          [assignment.assignment_id, student.student_id]
        );
        assignment.submission = submission || null;
      } else {
        const [submission] = await query(
          `SELECT * FROM OtherSubmission 
           WHERE assignment_id = ? AND account_id = ?`,
          [assignment.assignment_id, accountId]
        );
        assignment.submission = submission || null;
      }
    }

    return Response.json({
      course,
      assignments,
      materials,
      user,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

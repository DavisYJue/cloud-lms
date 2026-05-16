import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const cookiestore = await cookies();
    const sessionCookie = cookiestore.get("session");
    if (!sessionCookie) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);
    const { courseId } = await req.json();
    const account_id = session.account_id;

    const studentResult = await query(
      `SELECT student_id FROM student WHERE account_id = ?`,
      [account_id]
    );

    if (studentResult.length > 0) {
      const existing = await query(
        `SELECT * FROM Enrollment WHERE account_id = ? AND course_id = ?`,
        [account_id, courseId]
      );
      if (existing.length > 0) {
        return Response.json({ message: "Already enrolled" }, { status: 200 });
      }
      await query(
        `INSERT INTO Enrollment (account_id, course_id, enrollment_date, student_id, status)
         VALUES (?, ?, NOW(), ?, 'active')`,
        [account_id, courseId, studentResult[0].student_id]
      );
    } else {
      const existing = await query(
        `SELECT * FROM OtherEnrollment WHERE account_id = ? AND course_id = ?`,
        [account_id, courseId]
      );
      if (existing.length > 0) {
        return Response.json({ message: "Already enrolled" }, { status: 200 });
      }
      await query(
        `INSERT INTO OtherEnrollment (account_id, course_id, enrollment_date, status)
         VALUES (?, ?, NOW(), 'active')`,
        [account_id, courseId]
      );
    }

    return Response.json({ message: "Enrollment successful" }, { status: 200 });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

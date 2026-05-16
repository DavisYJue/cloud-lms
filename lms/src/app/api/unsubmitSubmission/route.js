import { query } from "../../../../lib/db";
import { cookies } from "next/headers";
import { unlink } from "fs/promises";
import { join } from "path";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = JSON.parse(cookieStore.get("session")?.value || "{}");

    if (!session.account_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [student, teacher, assistant, admin] = await Promise.all([
      query(`SELECT student_id FROM student WHERE account_id = ?`, [
        session.account_id,
      ]),
      query(`SELECT teacher_id FROM teacher WHERE account_id = ?`, [
        session.account_id,
      ]),
      query(`SELECT assistant_id FROM assistant WHERE account_id = ?`, [
        session.account_id,
      ]),
      query(`SELECT account_id FROM account WHERE account_id = ?`, [
        session.account_id,
      ]),
    ]);

    const isStudent = student.length > 0;
    const isOther =
      !isStudent &&
      (teacher.length > 0 || assistant.length > 0 || admin.length > 0);

    const { assignmentId } = await request.json();

    let submission;
    if (isStudent) {
      [submission] = await query(
        `SELECT * FROM submission 
         WHERE assignment_id = ? AND student_id = ?`,
        [assignmentId, student[0].student_id]
      );
    } else if (isOther) {
      [submission] = await query(
        `SELECT * FROM OtherSubmission 
         WHERE assignment_id = ? AND account_id = ?`,
        [assignmentId, session.account_id]
      );
    }

    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
      });
    }

    const filePaths = submission.file_path.split(",");

    for (const filePath of filePaths) {
      try {
        const fullPath = join(process.cwd(), "public", filePath);
        await unlink(fullPath);
      } catch (error) {
        console.error("Error deleting file:", filePath, error);
      }
    }

    if (isStudent) {
      await query(
        `DELETE FROM submission 
         WHERE submission_id = ?`,
        [submission.submission_id]
      );
    } else if (isOther) {
      await query(
        `DELETE FROM OtherSubmission 
         WHERE submission_id = ?`,
        [submission.submission_id]
      );
    }

    return new Response(
      JSON.stringify({ message: "Submission removed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unsubmit error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

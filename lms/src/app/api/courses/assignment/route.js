import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const courseId = cookieStore.get("selectedCourseId")?.value;
    if (!courseId) {
      return Response.json(
        { error: "Course ID not found in cookies." },
        { status: 400 }
      );
    }

    const assignments = await query(
      `SELECT assignment_id, assignment_title, max_grade, due_date
       FROM assignment
       WHERE course_id = ?`,
      [courseId]
    );

    const data = await Promise.all(
      assignments.map(async (a) => {
        const studentSubs = await query(
          `SELECT
            s.submission_id,
            st.student_name AS submitter,
            s.file_path,
            s.grade,
            s.grade IS NOT NULL AS confirmed,
            s.submission_time,
            s.graded_by,
            'student' AS role
          FROM submission s
          JOIN student st ON s.student_id = st.student_id
          WHERE s.assignment_id = ?`,
          [a.assignment_id]
        );

        const otherSubs = await query(
          `SELECT
            s.submission_id,
            COALESCE(t.teacher_name, a.assistant_name) AS submitter,
            s.file_path,
            s.grade,
            s.grade IS NOT NULL AS confirmed,
            s.submission_time,
            s.graded_by,
            acc.role AS role
          FROM othersubmission s
          JOIN account acc ON s.account_id = acc.account_id
          LEFT JOIN teacher t ON acc.account_id = t.account_id AND acc.role = 'teacher'
          LEFT JOIN assistant a ON acc.account_id = a.account_id AND acc.role = 'assistant'
          WHERE s.assignment_id = ?`,
          [a.assignment_id]
        );

        const notSubmitted = await query(
          `SELECT 
            s.student_name AS name
          FROM enrollment e
          JOIN student s ON e.student_id = s.student_id
          JOIN assignment a ON e.course_id = a.course_id
          LEFT JOIN submission sub 
          ON sub.assignment_id = a.assignment_id AND sub.student_id = s.student_id
          WHERE a.assignment_id = ?
          AND sub.submission_id IS NULL

          UNION

          SELECT 
            COALESCE(t.teacher_name, ast.assistant_name) AS name
          FROM otherenrollment oe
          JOIN account acc ON oe.account_id = acc.account_id
          LEFT JOIN teacher t ON acc.account_id = t.account_id AND acc.role = 'teacher'
          LEFT JOIN assistant ast ON acc.account_id = ast.account_id AND acc.role = 'assistant'
          JOIN assignment a2 ON oe.course_id = a2.course_id
          LEFT JOIN othersubmission osub 
            ON osub.assignment_id = a2.assignment_id AND osub.account_id = acc.account_id
          WHERE a2.assignment_id = ?
            AND osub.submission_id IS NULL`,
          [a.assignment_id, a.assignment_id]
        );

        return {
          assignment_id: a.assignment_id,
          title: a.assignment_title,
          max_grade: a.max_grade,
          due_date: a.due_date,
          submissions: [...studentSubs, ...otherSubs].map((s) => ({
            submission_id: s.submission_id,
            submitter: s.submitter,
            file_path: s.file_path,
            grade: s.grade,
            confirmed: !!s.confirmed,
            submission_time: s.submission_time,
            graded_by: s.graded_by,
            role: s.role,
          })),
          notSubmitted: notSubmitted.map((row) => row.name),
        };
      })
    );

    return Response.json(data);
  } catch (err) {
    console.error("GET error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { submission_id, new_grade, role } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const graderId = session ? JSON.parse(session).account_id : null;

    if (
      !submission_id ||
      new_grade === undefined ||
      !role ||
      graderId == null
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const allowedTables = {
      student: { table: "submission", audit: "grade_audit" },
      other: { table: "othersubmission", audit: "grade_audit_othersubmission" },
    };

    const isStudent = role === "student";
    const tableInfo = isStudent ? allowedTables.student : allowedTables.other;

    const [existing] = await query(
      `SELECT grade FROM ${tableInfo.table} WHERE submission_id = ?`,
      [submission_id]
    );
    if (!existing) {
      return Response.json({ error: "Submission not found." }, { status: 404 });
    }

    const old_grade = existing.grade;
    const gradeToSet = new_grade === "" ? null : new_grade;

    await query(
      `UPDATE ${tableInfo.table}
           SET grade = ?, graded_by = ?
         WHERE submission_id = ?`,
      [gradeToSet, graderId, submission_id]
    );

    await query(
      `INSERT INTO ${tableInfo.audit}
           (submission_id, old_grade, new_grade, changed_by, change_date)
         VALUES (?, ?, ?, ?, NOW())`,
      [submission_id, old_grade, gradeToSet, graderId]
    );

    return Response.json({ message: "Grade updated and audit logged." });
  } catch (err) {
    console.error("PUT error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { query } from "./db";

// Student

async function getStudentContext(account_id) {
  const [account] = await query(
    `SELECT a.username, a.email, a.telephone, a.address, a.bio, a.profile_image,
            s.student_name, s.class
     FROM account a
     LEFT JOIN student s ON s.account_id = a.account_id
     WHERE a.account_id = ?`,
    [account_id],
  );

  const courses = await query(
    `SELECT c.course_id, c.course_title, c.course_duration, c.course_description,
            c.course_type, c.start_date, c.end_date, e.status, e.enrollment_date
     FROM enrollment e
     INNER JOIN course c ON c.course_id = e.course_id
     WHERE e.account_id = ?`,
    [account_id],
  );

  const courseIds = courses.map((c) => c.course_id);
  if (!courseIds.length) {
    return {
      profile: account,
      courses: [],
      materials: [],
      assignments: [],
      submissions: [],
    };
  }

  const ph = courseIds.map(() => "?").join(",");

  const materials = await query(
    `SELECT m.material_id, m.material_title, m.material_file, m.course_id,
            c.course_title, m.uploaded_at
     FROM material m
     INNER JOIN course c ON c.course_id = m.course_id
     WHERE m.course_id IN (${ph})`,
    courseIds,
  );

  const assignments = await query(
    `SELECT a.assignment_id, a.assignment_title, a.assignment_description,
            a.max_grade, a.due_date, a.course_id, c.course_title
     FROM assignment a
     INNER JOIN course c ON c.course_id = a.course_id
     WHERE a.course_id IN (${ph})`,
    courseIds,
  );

  const [studentRow] = await query(
    "SELECT student_id FROM student WHERE account_id = ?",
    [account_id],
  );

  const submissions = studentRow
    ? await query(
        `SELECT s.submission_id, s.assignment_id, s.submission_time,
                s.file_path, s.grade, s.graded_by,
                a.assignment_title, a.max_grade, a.due_date, a.course_id,
                c.course_title,
                CASE WHEN s.submission_time IS NOT NULL THEN 'submitted' ELSE 'not submitted' END AS status
         FROM submission s
         INNER JOIN assignment a ON a.assignment_id = s.assignment_id
         INNER JOIN course c ON c.course_id = a.course_id
         WHERE s.student_id = ?`,
        [studentRow.student_id],
      )
    : [];

  return { profile: account, courses, materials, assignments, submissions };
}

// Teacher

async function getTeacherContext(account_id) {
  const [account] = await query(
    `SELECT a.username, a.email, a.telephone, a.address, a.bio, a.profile_image,
            t.teacher_name, t.faculty
     FROM account a
     LEFT JOIN teacher t ON t.account_id = a.account_id
     WHERE a.account_id = ?`,
    [account_id],
  );

  const [teacherRow] = await query(
    "SELECT teacher_id FROM teacher WHERE account_id = ?",
    [account_id],
  );

  const ownedCourses = teacherRow
    ? await query(
        `SELECT course_id, course_title, course_duration, course_description,
                course_type, start_date, end_date
         FROM course WHERE teacher_id = ?`,
        [teacherRow.teacher_id],
      )
    : [];

  const ownedCourseIds = ownedCourses.map((c) => c.course_id);
  let ownedMaterials = [],
    ownedAssignments = [],
    enrolledStudents = [],
    tas = [],
    studentSubmissions = [];

  if (ownedCourseIds.length) {
    const ph = ownedCourseIds.map(() => "?").join(",");

    ownedMaterials = await query(
      `SELECT m.material_id, m.material_title, m.material_file, m.course_id, c.course_title
       FROM material m INNER JOIN course c ON c.course_id = m.course_id
       WHERE m.course_id IN (${ph})`,
      ownedCourseIds,
    );

    ownedAssignments = await query(
      `SELECT a.assignment_id, a.assignment_title, a.assignment_description,
              a.max_grade, a.due_date, a.course_id, c.course_title
       FROM assignment a INNER JOIN course c ON c.course_id = a.course_id
       WHERE a.course_id IN (${ph})`,
      ownedCourseIds,
    );

    enrolledStudents = await query(
      `SELECT s.student_id, s.student_name, s.class, a.email,
              e.course_id, c.course_title, e.status, e.enrollment_date
       FROM enrollment e
       INNER JOIN student s ON s.student_id = e.student_id
       INNER JOIN account a ON a.account_id = s.account_id
       INNER JOIN course c ON c.course_id = e.course_id
       WHERE e.course_id IN (${ph})`,
      ownedCourseIds,
    );

    tas = await query(
      `SELECT ast.assistant_name, ast.department, ac.email,
              ta.course_id, c.course_title, ta.assigned_at
       FROM teaching_assistant ta
       INNER JOIN assistant ast ON ast.assistant_id = ta.assistant_id
       INNER JOIN account ac ON ac.account_id = ast.account_id
       INNER JOIN course c ON c.course_id = ta.course_id
       WHERE ta.course_id IN (${ph})`,
      ownedCourseIds,
    );

    studentSubmissions = await query(
      `SELECT sb.submission_id, sb.assignment_id, sb.student_id, sb.submission_time,
              sb.file_path, sb.grade, sb.graded_by,
              a.assignment_title, a.max_grade, a.course_id, c.course_title,
              s.student_name,
              CASE WHEN sb.submission_time IS NOT NULL THEN 'submitted' ELSE 'not submitted' END AS status
       FROM submission sb
       INNER JOIN assignment a ON a.assignment_id = sb.assignment_id
       INNER JOIN course c ON c.course_id = a.course_id
       INNER JOIN student s ON s.student_id = sb.student_id
       WHERE a.course_id IN (${ph})`,
      ownedCourseIds,
    );
  }

  const participantCourses = await query(
    `SELECT c.course_id, c.course_title, c.course_duration, c.course_type,
            c.start_date, c.end_date, oe.status, oe.enrollment_date
     FROM otherenrollment oe
     INNER JOIN course c ON c.course_id = oe.course_id
     WHERE oe.account_id = ?`,
    [account_id],
  );

  const participantCourseIds = participantCourses.map((c) => c.course_id);
  let participantMaterials = [],
    participantAssignments = [],
    participantSubmissions = [];

  if (participantCourseIds.length) {
    const ph = participantCourseIds.map(() => "?").join(",");

    participantMaterials = await query(
      `SELECT m.material_title, m.material_file, m.course_id, c.course_title
       FROM material m INNER JOIN course c ON c.course_id = m.course_id
       WHERE m.course_id IN (${ph})`,
      participantCourseIds,
    );

    participantAssignments = await query(
      `SELECT a.assignment_id, a.assignment_title, a.max_grade, a.due_date,
              a.course_id, c.course_title
       FROM assignment a INNER JOIN course c ON c.course_id = a.course_id
       WHERE a.course_id IN (${ph})`,
      participantCourseIds,
    );

    participantSubmissions = await query(
      `SELECT os.submission_id, os.assignment_id, os.submission_time,
              os.file_path, os.grade, os.graded_by,
              a.assignment_title, a.max_grade, c.course_title,
              CASE WHEN os.submission_time IS NOT NULL THEN 'submitted' ELSE 'not submitted' END AS status
       FROM othersubmission os
       INNER JOIN assignment a ON a.assignment_id = os.assignment_id
       INNER JOIN course c ON c.course_id = a.course_id
       WHERE os.account_id = ?`,
      [account_id],
    );
  }

  return {
    profile: account,
    asOwner: {
      courses: ownedCourses,
      materials: ownedMaterials,
      assignments: ownedAssignments,
      enrolledStudents,
      teachingAssistants: tas,
      studentSubmissions,
    },
    asParticipant: {
      courses: participantCourses,
      materials: participantMaterials,
      assignments: participantAssignments,
      submissions: participantSubmissions,
    },
  };
}

// Assistant

async function getAssistantContext(account_id) {
  const [account] = await query(
    `SELECT a.username, a.email, a.telephone, a.address, a.bio, a.profile_image,
            ast.assistant_name, ast.department
     FROM account a
     LEFT JOIN assistant ast ON ast.account_id = a.account_id
     WHERE a.account_id = ?`,
    [account_id],
  );

  const [assistantRow] = await query(
    "SELECT assistant_id FROM assistant WHERE account_id = ?",
    [account_id],
  );

  const taCourses = assistantRow
    ? await query(
        `SELECT c.course_id, c.course_title, c.course_duration, c.course_type,
                c.start_date, c.end_date, ta.assigned_at
         FROM teaching_assistant ta
         INNER JOIN course c ON c.course_id = ta.course_id
         WHERE ta.assistant_id = ?`,
        [assistantRow.assistant_id],
      )
    : [];

  const taCourseIds = taCourses.map((c) => c.course_id);
  let taMaterials = [],
    taAssignments = [],
    taSubmissions = [];

  if (taCourseIds.length) {
    const ph = taCourseIds.map(() => "?").join(",");

    taMaterials = await query(
      `SELECT m.material_title, m.material_file, m.course_id, c.course_title
       FROM material m INNER JOIN course c ON c.course_id = m.course_id
       WHERE m.course_id IN (${ph})`,
      taCourseIds,
    );

    taAssignments = await query(
      `SELECT a.assignment_id, a.assignment_title, a.max_grade, a.due_date,
              a.course_id, c.course_title
       FROM assignment a INNER JOIN course c ON c.course_id = a.course_id
       WHERE a.course_id IN (${ph})`,
      taCourseIds,
    );

    taSubmissions = await query(
      `SELECT sb.submission_id, sb.assignment_id, sb.student_id, sb.submission_time,
              sb.grade, sb.graded_by, a.assignment_title, a.max_grade,
              c.course_title, s.student_name,
              CASE WHEN sb.submission_time IS NOT NULL THEN 'submitted' ELSE 'not submitted' END AS status
       FROM submission sb
       INNER JOIN assignment a ON a.assignment_id = sb.assignment_id
       INNER JOIN course c ON c.course_id = a.course_id
       INNER JOIN student s ON s.student_id = sb.student_id
       WHERE a.course_id IN (${ph})`,
      taCourseIds,
    );
  }

  const participantCourses = await query(
    `SELECT c.course_id, c.course_title, c.course_duration, c.course_type,
            c.start_date, c.end_date, oe.status, oe.enrollment_date
     FROM otherenrollment oe
     INNER JOIN course c ON c.course_id = oe.course_id
     WHERE oe.account_id = ?`,
    [account_id],
  );

  const participantCourseIds = participantCourses.map((c) => c.course_id);
  let participantMaterials = [],
    participantAssignments = [],
    participantSubmissions = [];

  if (participantCourseIds.length) {
    const ph = participantCourseIds.map(() => "?").join(",");

    participantMaterials = await query(
      `SELECT m.material_title, m.material_file, m.course_id, c.course_title
       FROM material m INNER JOIN course c ON c.course_id = m.course_id
       WHERE m.course_id IN (${ph})`,
      participantCourseIds,
    );

    participantAssignments = await query(
      `SELECT a.assignment_id, a.assignment_title, a.max_grade, a.due_date,
              a.course_id, c.course_title
       FROM assignment a INNER JOIN course c ON c.course_id = a.course_id
       WHERE a.course_id IN (${ph})`,
      participantCourseIds,
    );

    participantSubmissions = await query(
      `SELECT os.submission_id, os.assignment_id, os.submission_time,
              os.grade, os.graded_by, a.assignment_title, a.max_grade,
              c.course_title,
              CASE WHEN os.submission_time IS NOT NULL THEN 'submitted' ELSE 'not submitted' END AS status
       FROM othersubmission os
       INNER JOIN assignment a ON a.assignment_id = os.assignment_id
       INNER JOIN course c ON c.course_id = a.course_id
       WHERE os.account_id = ?`,
      [account_id],
    );
  }

  return {
    profile: account,
    asTA: {
      courses: taCourses,
      materials: taMaterials,
      assignments: taAssignments,
      submissions: taSubmissions,
    },
    asParticipant: {
      courses: participantCourses,
      materials: participantMaterials,
      assignments: participantAssignments,
      submissions: participantSubmissions,
    },
  };
}

// Admin

async function getAdminContext(account_id) {
  const [account] = await query(
    `SELECT username, email, telephone, address, bio FROM account WHERE account_id = ?`,
    [account_id],
  );

  const [counts] = await query(`
    SELECT
      (SELECT COUNT(*) FROM account) AS total_accounts,
      (SELECT COUNT(*) FROM course) AS total_courses,
      (SELECT COUNT(*) FROM student) AS total_students,
      (SELECT COUNT(*) FROM teacher) AS total_teachers,
      (SELECT COUNT(*) FROM assistant) AS total_assistants,
      (SELECT COUNT(*) FROM enrollment) AS total_enrollments,
      (SELECT COUNT(*) FROM submission) AS total_submissions
  `);

  const courses = await query(
    `SELECT c.course_id, c.course_title, c.course_type, c.start_date, c.end_date,
            t.teacher_name, a.email AS teacher_email
     FROM course c
     LEFT JOIN teacher t ON t.teacher_id = c.teacher_id
     LEFT JOIN account a ON a.account_id = t.account_id`,
  );

  const accounts = await query(
    `SELECT account_id, username, email, role FROM account ORDER BY role`,
  );

  return { profile: account, systemSummary: counts, courses, accounts };
}

// Entry point

export async function getDBContext(account_id, role) {
  switch (role) {
    case "student":
      return getStudentContext(account_id);
    case "teacher":
      return getTeacherContext(account_id);
    case "assistant":
      return getAssistantContext(account_id);
    case "administrator":
      return getAdminContext(account_id);
    default:
      return {};
  }
}

// Allowed file paths for RAG filtering

export async function getAllowedFilePaths(account_id, role) {
  // No filter for Admin
  if (role === "administrator") return null;

  let courseIds = [];

  if (role === "student") {
    const rows = await query(
      "SELECT course_id FROM enrollment WHERE account_id = ?",
      [account_id],
    );
    courseIds = rows.map((r) => r.course_id);
  }

  if (role === "teacher") {
    const [teacherRow] = await query(
      "SELECT teacher_id FROM teacher WHERE account_id = ?",
      [account_id],
    );
    const owned = teacherRow
      ? await query("SELECT course_id FROM course WHERE teacher_id = ?", [
          teacherRow.teacher_id,
        ])
      : [];
    const joined = await query(
      "SELECT course_id FROM otherenrollment WHERE account_id = ?",
      [account_id],
    );
    courseIds = [
      ...owned.map((r) => r.course_id),
      ...joined.map((r) => r.course_id),
    ];
  }

  if (role === "assistant") {
    const [assistantRow] = await query(
      "SELECT assistant_id FROM assistant WHERE account_id = ?",
      [account_id],
    );
    const ta = assistantRow
      ? await query(
          "SELECT course_id FROM teaching_assistant WHERE assistant_id = ?",
          [assistantRow.assistant_id],
        )
      : [];
    const joined = await query(
      "SELECT course_id FROM otherenrollment WHERE account_id = ?",
      [account_id],
    );
    courseIds = [
      ...ta.map((r) => r.course_id),
      ...joined.map((r) => r.course_id),
    ];
  }

  if (!courseIds.length) return [];

  courseIds = [...new Set(courseIds)];
  const ph = courseIds.map(() => "?").join(",");

  // Fetch material file paths
  const materials = await query(
    `SELECT material_file FROM material WHERE course_id IN (${ph})`,
    courseIds,
  );

  // Fetch assignment material file paths
  const assignmentMaterials = await query(
    `SELECT file_path FROM assignment_material WHERE course_id IN (${ph})`,
    courseIds,
  );

  // Convert to container absolute paths and deduplicate
  const paths = [
    ...materials.map((m) => `/app/public${m.material_file}`),
    ...assignmentMaterials.map((m) => `/app/public${m.file_path}`),
  ];

  return [...new Set(paths)];
}

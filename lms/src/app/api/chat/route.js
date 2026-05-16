import { cookies } from "next/headers";
import { getDBContext, getAllowedFilePaths } from "../../../../lib/dbContext";

const RAG_URL = process.env.RAG_URL ?? "http://localhost:8000";

// Summarize DB context into compact text

function summarizeContext(ctx, role) {
  if (!ctx) return "No data available.";
  const lines = [];

  const fmt = (label, val) => (val != null ? `${label}: ${val}` : null);

  // Profile
  if (ctx.profile) {
    const p = ctx.profile;
    lines.push("## Profile");
    if (p.student_name) lines.push(fmt("Name", p.student_name));
    if (p.teacher_name) lines.push(fmt("Name", p.teacher_name));
    if (p.assistant_name) lines.push(fmt("Name", p.assistant_name));
    if (p.username) lines.push(fmt("Username", p.username));
    if (p.email) lines.push(fmt("Email", p.email));
    if (p.class) lines.push(fmt("Class", p.class));
    if (p.faculty) lines.push(fmt("Faculty", p.faculty));
    if (p.department) lines.push(fmt("Department", p.department));
  }

  // Student
  if (role === "student") {
    if (ctx.courses?.length) {
      lines.push("\n## Enrolled Courses");
      ctx.courses.forEach((c) =>
        lines.push(
          `- ${c.course_title} (${c.course_duration}, status: ${c.status})`,
        ),
      );
    }
    if (ctx.assignments?.length) {
      lines.push("\n## Assignments");
      ctx.assignments.forEach((a) =>
        lines.push(
          `- [${a.course_title}] ${a.assignment_title} | due: ${a.due_date} | max grade: ${a.max_grade}`,
        ),
      );
    }
    if (ctx.submissions?.length) {
      lines.push("\n## My Submissions");
      ctx.submissions.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.assignment_title} | status: ${s.status} | grade: ${s.grade ?? "not graded"} / ${s.max_grade}`,
        ),
      );
    }
    if (ctx.materials?.length) {
      lines.push("\n## Course Materials");
      ctx.materials.forEach((m) =>
        lines.push(`- [${m.course_title}] ${m.material_title}`),
      );
    }
  }

  // Teacher
  if (role === "teacher") {
    if (ctx.asOwner?.courses?.length) {
      lines.push("\n## Courses I Teach");
      ctx.asOwner.courses.forEach((c) =>
        lines.push(
          `- ${c.course_title} (${c.course_type}, ${c.start_date} to ${c.end_date})`,
        ),
      );
    }
    if (ctx.asOwner?.enrolledStudents?.length) {
      lines.push("\n## Enrolled Students");
      ctx.asOwner.enrolledStudents.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.student_name} (${s.class}), status: ${s.status}`,
        ),
      );
    }
    if (ctx.asOwner?.teachingAssistants?.length) {
      lines.push("\n## Teaching Assistants");
      ctx.asOwner.teachingAssistants.forEach((t) =>
        lines.push(
          `- [${t.course_title}] ${t.assistant_name} (${t.department})`,
        ),
      );
    }
    if (ctx.asOwner?.assignments?.length) {
      lines.push("\n## Assignments I Set");
      ctx.asOwner.assignments.forEach((a) =>
        lines.push(
          `- [${a.course_title}] ${a.assignment_title} | due: ${a.due_date} | max: ${a.max_grade}`,
        ),
      );
    }
    if (ctx.asOwner?.studentSubmissions?.length) {
      lines.push("\n## Student Submissions");
      ctx.asOwner.studentSubmissions.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.assignment_title} | ${s.student_name} | status: ${s.status} | grade: ${s.grade ?? "not graded"} / ${s.max_grade}`,
        ),
      );
    }
    if (ctx.asOwner?.materials?.length) {
      lines.push("\n## Course Materials");
      ctx.asOwner.materials.forEach((m) =>
        lines.push(`- [${m.course_title}] ${m.material_title}`),
      );
    }
    if (ctx.asParticipant?.courses?.length) {
      lines.push("\n## Courses I Joined as Participant");
      ctx.asParticipant.courses.forEach((c) =>
        lines.push(`- ${c.course_title} (status: ${c.status})`),
      );
    }
    if (ctx.asParticipant?.submissions?.length) {
      lines.push("\n## My Submissions as Participant");
      ctx.asParticipant.submissions.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.assignment_title} | status: ${s.status} | grade: ${s.grade ?? "not graded"} / ${s.max_grade}`,
        ),
      );
    }
  }

  // Assistant
  if (role === "assistant") {
    if (ctx.asTA?.courses?.length) {
      lines.push("\n## Courses I'm TA For");
      ctx.asTA.courses.forEach((c) =>
        lines.push(`- ${c.course_title} (${c.course_type})`),
      );
    }
    if (ctx.asTA?.assignments?.length) {
      lines.push("\n## Assignments");
      ctx.asTA.assignments.forEach((a) =>
        lines.push(
          `- [${a.course_title}] ${a.assignment_title} | due: ${a.due_date} | max: ${a.max_grade}`,
        ),
      );
    }
    if (ctx.asTA?.submissions?.length) {
      lines.push("\n## Student Submissions");
      ctx.asTA.submissions.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.assignment_title} | ${s.student_name} | status: ${s.status} | grade: ${s.grade ?? "not graded"} / ${s.max_grade}`,
        ),
      );
    }
    if (ctx.asParticipant?.courses?.length) {
      lines.push("\n## Courses I Joined as Participant");
      ctx.asParticipant.courses.forEach((c) =>
        lines.push(`- ${c.course_title} (status: ${c.status})`),
      );
    }
    if (ctx.asParticipant?.submissions?.length) {
      lines.push("\n## My Submissions as Participant");
      ctx.asParticipant.submissions.forEach((s) =>
        lines.push(
          `- [${s.course_title}] ${s.assignment_title} | status: ${s.status} | grade: ${s.grade ?? "not graded"} / ${s.max_grade}`,
        ),
      );
    }
  }

  // Admin
  if (role === "administration") {
    if (ctx.systemSummary) {
      lines.push("\n## System Summary");
      Object.entries(ctx.systemSummary).forEach(([k, v]) =>
        lines.push(`- ${k}: ${v}`),
      );
    }
    if (ctx.courses?.length) {
      lines.push("\n## All Courses");
      ctx.courses.forEach((c) =>
        lines.push(
          `- ${c.course_title} | teacher: ${c.teacher_name ?? "N/A"} | type: ${c.course_type}`,
        ),
      );
    }
  }

  return lines.filter(Boolean).join("\n");
}

// Route handler

export async function POST(request) {
  try {
    // 1. Auth
    const cookieStore = await cookies();
    const raw = cookieStore.get("session")?.value;
    if (!raw) {
      return Response.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { account_id, role } = JSON.parse(raw);

    // 2. Question
    const { question } = await request.json();
    if (!question?.trim()) {
      return Response.json(
        { error: "Question cannot be empty." },
        { status: 400 },
      );
    }

    // 3. Fetch DB context and allowed file paths
    const [rawContext, allowedFilePaths] = await Promise.all([
      getDBContext(account_id, role),
      getAllowedFilePaths(account_id, role),
    ]);
    const dbSummary = summarizeContext(rawContext, role);

    // 4. Call RAG
    const ragRes = await fetch(`${RAG_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        db_summary: dbSummary,
        role: role,
        file_paths: allowedFilePaths,
      }),
      signal: AbortSignal.timeout(900_000),
    });

    if (!ragRes.ok) {
      const err = await ragRes.text();
      return Response.json({ error: `RAG error: ${err}` }, { status: 502 });
    }

    const ragData = await ragRes.json();

    // Blocks from deepseek-r1 reasoning
    const answer = ragData.answer
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();

    return Response.json({ answer });
  } catch (err) {
    console.error("[/api/chat]", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

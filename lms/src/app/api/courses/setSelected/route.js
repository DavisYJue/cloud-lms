import { cookies } from "next/headers";

export async function POST(request) {
  const body = await request.json();
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = JSON.parse(sessionCookie.value);
  session.selected_course_id = body.course_id;

  cookieStore.set("session", JSON.stringify(session), {
    path: "/",
    httpOnly: true,
  });

  return Response.json({ message: "Course selected" });
}

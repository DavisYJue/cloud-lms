import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const assignmentId = body.assignmentId;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ message: "Assignment ID set" });
    response.cookies.set("selectedAssignmentId", assignmentId.toString(), {
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}

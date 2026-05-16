import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookiestore = await cookies();
    const sessionCookie = cookiestore.get("session");
    if (!sessionCookie) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const session = JSON.parse(sessionCookie.value);

    const courses = await query(
      `
      SELECT 
        c.course_id,
        c.course_title AS title,
        COALESCE(c.course_image, '/courses/defaultCourseImage.jpg') AS imageUrl,
        CONCAT(DATE_FORMAT(c.start_date, '%b %Y'), ' - ', DATE_FORMAT(c.end_date, '%b %Y')) AS dateRange,
        CASE
          WHEN CURDATE() BETWEEN c.start_date AND c.end_date THEN 'ongoing'
          WHEN CURDATE() > c.end_date THEN 'completed'
          WHEN CURDATE() < c.start_date THEN 'outdated'
          ELSE 'other'
        END AS status
      FROM Course c
      JOIN (
        SELECT course_id FROM Enrollment WHERE account_id = ?
        UNION
        SELECT course_id FROM OtherEnrollment WHERE account_id = ?
      ) AS combined
      ON c.course_id = combined.course_id
    `,
      [session.account_id, session.account_id]
    );

    return Response.json(courses);
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { query } from "../../../../../lib/db";

export async function GET() {
  try {
    const courses = await query(
      `SELECT 
          course_id, 
          course_title AS title, 
          course_image AS imageUrl,
          CONCAT(DATE_FORMAT(start_date, '%b %Y'), ' - ', DATE_FORMAT(end_date, '%b %Y')) AS dateRange,
          course_type AS status
       FROM Course
       WHERE course_type = 'public'`
    );

    return Response.json(courses);
  } catch (error) {
    console.error("Error fetching public courses:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

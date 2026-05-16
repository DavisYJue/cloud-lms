import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { query } from "../../../../../lib/db";

export async function DELETE(req) {
  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const courseImages = await query(
      "SELECT course_image FROM course WHERE course_id = ?",
      [courseId]
    );

    const assignments = await query(
      "SELECT assignment_id FROM assignment WHERE course_id = ?",
      [courseId]
    );
    const assignmentIds = assignments.map((a) => a.assignment_id);

    const allPaths = [];

    if (courseImages.length > 0 && courseImages[0].course_image) {
      allPaths.push(courseImages[0].course_image);
    }

    const materials = await query(
      "SELECT material_file FROM material WHERE course_id = ?",
      [courseId]
    );
    materials.forEach(({ material_file }) => {
      if (material_file) allPaths.push(material_file);
    });

    const assignmentMaterials = await query(
      "SELECT file_path FROM assignment_material WHERE course_id = ?",
      [courseId]
    );
    assignmentMaterials.forEach(({ file_path }) => {
      if (file_path) allPaths.push(file_path);
    });

    if (assignmentIds.length > 0) {
      const placeholders = assignmentIds.map(() => "?").join(",");

      const submissions = await query(
        `SELECT file_path FROM submission WHERE assignment_id IN (${placeholders})`,
        assignmentIds
      );
      submissions.forEach(({ file_path }) => {
        if (file_path) allPaths.push(file_path);
      });

      const otherSubmissions = await query(
        `SELECT file_path FROM othersubmission WHERE assignment_id IN (${placeholders})`,
        assignmentIds
      );
      otherSubmissions.forEach(({ file_path }) => {
        if (file_path) {
          file_path
            .split(",")
            .forEach((p) => p.trim() && allPaths.push(p.trim()));
        }
      });
    }

    await Promise.all(
      allPaths.map(async (relativePath) => {
        const fullPath = path.join(
          process.cwd(),
          "public",
          relativePath.startsWith("/") ? relativePath.slice(1) : relativePath
        );

        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.warn(`Failed to delete file: ${fullPath}`, error.message);
        }
      })
    );

    const deletionSteps = [
      async () => {
        if (assignmentIds.length > 0) {
          const placeholders = assignmentIds.map(() => "?").join(",");
          await query(
            `DELETE FROM submission WHERE assignment_id IN (${placeholders})`,
            assignmentIds
          );
          await query(
            `DELETE FROM othersubmission WHERE assignment_id IN (${placeholders})`,
            assignmentIds
          );
        }
      },

      () =>
        query("DELETE FROM assignment_material WHERE course_id = ?", [
          courseId,
        ]),
      () => query("DELETE FROM assignment WHERE course_id = ?", [courseId]),

      () => query("DELETE FROM material WHERE course_id = ?", [courseId]),
      () => query("DELETE FROM enrollment WHERE course_id = ?", [courseId]),
      () =>
        query("DELETE FROM otherenrollment WHERE course_id = ?", [courseId]),
      () =>
        query("DELETE FROM teaching_assistant WHERE course_id = ?", [courseId]),
      () => query("DELETE FROM course WHERE course_id = ?", [courseId]),
    ];

    for (const step of deletionSteps) {
      await step();
    }

    return NextResponse.json(
      { message: "Course deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: `Failed to delete course: ${error.message}` },
      { status: 500 }
    );
  }
}

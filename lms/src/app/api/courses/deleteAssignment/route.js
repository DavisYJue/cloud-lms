import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { query } from "../../../../../lib/db";

export async function DELETE(req) {
  try {
    const { assignment_id } = await req.json();
    if (!assignment_id) {
      return NextResponse.json(
        { error: "Missing assignment_id" },
        { status: 400 }
      );
    }

    const mats = await query(
      "SELECT file_path FROM assignment_material WHERE assignment_id = ?",
      [assignment_id]
    );

    const studs = await query(
      "SELECT file_path FROM submission WHERE assignment_id = ?",
      [assignment_id]
    );

    const others = await query(
      "SELECT file_path FROM othersubmission WHERE assignment_id = ?",
      [assignment_id]
    );

    const allPaths = [];

    for (const row of mats) {
      if (row.file_path) allPaths.push(row.file_path);
    }

    const collectSplit = (row) => {
      if (!row.file_path) return;
      row.file_path
        .split(",")
        .map((p) => p.trim())
        .forEach((p) => p && allPaths.push(p));
    };
    studs.forEach(collectSplit);
    others.forEach(collectSplit);

    for (const relPath of allPaths) {
      const safePath = relPath.startsWith("/") ? relPath.slice(1) : relPath;
      const fullPath = path.join(process.cwd(), "public", safePath);

      try {
        await fs.unlink(fullPath);
      } catch (e) {
        console.warn(`Could not delete file ${fullPath}:`, e.message);
      }
    }

    await query("DELETE FROM submission WHERE assignment_id = ?", [
      assignment_id,
    ]);
    await query("DELETE FROM othersubmission WHERE assignment_id = ?", [
      assignment_id,
    ]);
    await query("DELETE FROM assignment_material WHERE assignment_id = ?", [
      assignment_id,
    ]);
    await query("DELETE FROM assignment WHERE assignment_id = ?", [
      assignment_id,
    ]);

    return NextResponse.json({
      success: true,
      message: "Assignment and all related files deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

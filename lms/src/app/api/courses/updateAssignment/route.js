import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { ragIngest, ragDelete } from "../../../../../lib/rag";
import path from "path";
import fs from "fs";
import Busboy from "busboy";

export const config = { api: { bodyParser: false } };

async function readStream(stream) {
  const chunks = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req) {
  const contentType = req.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "Invalid content type" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const assignmentId = cookieStore.get("selectedAssignmentId")?.value;
  const courseId = cookieStore.get("selectedCourseId")?.value;
  if (!assignmentId || !courseId) {
    return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
  }

  const newFiles = [];

  try {
    const rawBody = await readStream(req.body);
    const busboy = Busboy({ headers: { "content-type": contentType } });
    const fields = {};
    let keepExistingFiles = false;
    const timestamp = Date.now();
    const uploadDir = path.join(process.cwd(), "public/courseMaterials");

    await new Promise((resolve, reject) => {
      busboy.on("field", (name, value) => {
        if (name === "keep_existing_files") {
          keepExistingFiles = value === "true";
        } else {
          fields[name] = value;
        }
      });

      busboy.on("file", (name, file, info) => {
        const newName = `${timestamp}-${info.filename}`;
        const savePath = path.join(uploadDir, newName);
        file.pipe(fs.createWriteStream(savePath));
        newFiles.push({
          path: `/courseMaterials/${newName}`,
          physicalPath: savePath,
        });
      });

      busboy.on("error", reject);
      busboy.on("finish", resolve);
      busboy.write(rawBody);
      busboy.end();
    });

    const { assignment_title, assignment_description, due_date } = fields;
    if (!assignment_title || !assignment_description || !due_date) {
      newFiles.forEach(
        (f) => fs.existsSync(f.physicalPath) && fs.unlinkSync(f.physicalPath),
      );
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // If replacing files, delete old ones from disk + RAG
    if (!keepExistingFiles) {
      const existingFiles = await query(
        "SELECT file_path FROM assignment_material WHERE assignment_id = ?",
        [assignmentId],
      );

      for (const file of existingFiles) {
        const absPath = path.join(process.cwd(), "public", file.file_path);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
        ragDelete(file.file_path);
      }

      await query("DELETE FROM assignment_material WHERE assignment_id = ?", [
        assignmentId,
      ]);
    }

    await query(
      `UPDATE assignment SET
        assignment_title = ?, assignment_description = ?, due_date = ?, updated_at = NOW()
       WHERE assignment_id = ?`,
      [assignment_title, assignment_description, due_date, assignmentId],
    );

    if (newFiles.length > 0) {
      for (const file of newFiles) {
        await query(
          "INSERT INTO assignment_material (assignment_id, course_id, file_path) VALUES (?, ?, ?)",
          [assignmentId, courseId, file.path],
        );
        ragIngest(file.path);
      }
    }

    return NextResponse.json(
      { message: "Assignment updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Processing error:", error);
    newFiles?.forEach(
      (f) => fs.existsSync(f.physicalPath) && fs.unlinkSync(f.physicalPath),
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

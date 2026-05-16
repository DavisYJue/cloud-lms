import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { ragIngest, ragDelete } from "../../../../../lib/rag";
import path from "path";
import fs from "fs";
import Busboy from "busboy";
import { PassThrough } from "stream";

const materialsDir = path.join(process.cwd(), "public", "materials");
if (!fs.existsSync(materialsDir))
  fs.mkdirSync(materialsDir, { recursive: true });

// GET

export async function GET() {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;
  if (!courseId)
    return NextResponse.json({ error: "No course selected." }, { status: 400 });

  const courseResults = await query(
    "SELECT course_title, course_description FROM course WHERE course_id = ?",
    [courseId],
  );
  if (courseResults.length === 0)
    return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const materialResults = await query(
    "SELECT * FROM material WHERE course_id = ?",
    [courseId],
  );
  return NextResponse.json({
    materials: materialResults,
    course: courseResults[0],
  });
}

// POST (upload new material)

export async function POST(req) {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;
  const session = cookieStore.get("session")?.value;
  const accountId = session ? JSON.parse(session).account_id : null;

  if (!courseId || !accountId) {
    return NextResponse.json(
      { error: "Missing session or course ID." },
      { status: 400 },
    );
  }

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 },
      );
    }

    const busboy = Busboy({ headers: { "content-type": contentType } });
    const stream = new PassThrough();
    let title = "";
    let filePath = "";
    let fileName = "";

    busboy.on("field", (name, value) => {
      if (name === "title") title = value;
    });

    busboy.on("file", (name, file, info) => {
      const safeName = `${Date.now()}-${info.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      filePath = `/materials/${safeName}`;
      fileName = path.join(materialsDir, safeName);
      file.pipe(fs.createWriteStream(fileName));
    });

    const processPromise = new Promise((resolve, reject) => {
      busboy.on("finish", async () => {
        try {
          await query(
            `INSERT INTO material (material_title, material_file, course_id, uploaded_by, uploaded_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [title, filePath, courseId, accountId],
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      busboy.on("error", reject);
    });

    const reader = req.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        stream.end();
        break;
      }
      stream.write(value);
    }
    stream.pipe(busboy);
    await processPromise;

    // Trigger RAG ingestion
    ragIngest(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE

export async function DELETE(req) {
  const { material_id } = await req.json();
  if (!material_id)
    return NextResponse.json(
      { error: "Missing material ID." },
      { status: 400 },
    );

  const rows = await query(
    "SELECT material_file FROM material WHERE material_id = ?",
    [material_id],
  );
  if (rows.length === 0)
    return NextResponse.json({ error: "Material not found." }, { status: 404 });

  const relPath = rows[0].material_file;
  const absPath = path.join(process.cwd(), "public", relPath);
  if (fs.existsSync(absPath)) fs.unlinkSync(absPath);

  await query("DELETE FROM material WHERE material_id = ?", [material_id]);

  // Tell RAG to remove chunks
  ragDelete(relPath);

  return NextResponse.json({ success: true });
}

// PUT (rename)

export async function PUT(req) {
  const { material_id, new_title } = await req.json();
  if (!material_id || !new_title?.trim()) {
    return NextResponse.json(
      { error: "Missing required data." },
      { status: 400 },
    );
  }
  try {
    await query(
      "UPDATE material SET material_title = ? WHERE material_id = ?",
      [new_title.trim(), material_id],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 },
    );
  }
}

// PATCH (replace file)

export async function PATCH(req) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const accountId = session ? JSON.parse(session).account_id : null;
  if (!accountId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 },
      );
    }

    const busboy = Busboy({ headers: { "content-type": contentType } });
    const stream = new PassThrough();
    let materialId;
    let newRelPath = "";
    let newAbsPath = "";
    let oldRelPath = "";

    busboy.on("field", (name, value) => {
      if (name === "material_id") materialId = value;
    });

    busboy.on("file", (name, file, info) => {
      const safeName = `${Date.now()}-${info.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      newRelPath = `/materials/${safeName}`;
      newAbsPath = path.join(materialsDir, safeName);
      file.pipe(fs.createWriteStream(newAbsPath));
    });

    const processPromise = new Promise((resolve, reject) => {
      busboy.on("finish", async () => {
        try {
          if (!materialId) return reject(new Error("Missing material ID"));

          const [oldFile] = await query(
            "SELECT material_file FROM material WHERE material_id = ?",
            [materialId],
          );

          if (oldFile?.material_file) {
            oldRelPath = oldFile.material_file;
            const oldAbs = path.join(process.cwd(), "public", oldRelPath);
            if (fs.existsSync(oldAbs)) fs.unlinkSync(oldAbs);
          }

          await query(
            "UPDATE material SET material_file = ? WHERE material_id = ?",
            [newRelPath, materialId],
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      busboy.on("error", reject);
    });

    const reader = req.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      stream.write(value);
    }
    stream.end();
    stream.pipe(busboy);
    await processPromise;

    // Remove old PDF from RAG, ingest new one
    if (oldRelPath) ragDelete(oldRelPath);
    ragIngest(newRelPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

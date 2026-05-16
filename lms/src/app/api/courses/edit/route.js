import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "../../../../../lib/db";
import fs from "fs";
import path from "path";
import Busboy from "busboy";

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const uploadFile = async (fileBuffer, fileName) => {
  const uploadDir = path.join(process.cwd(), "public", "courses");
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const uniqueFileName = `${Date.now()}-${fileName}`;
  const filePath = path.join(uploadDir, uniqueFileName);
  await fs.promises.writeFile(filePath, fileBuffer);
  return `/courses/${uniqueFileName}`;
};

export async function PUT(request) {
  const cookieStore = await cookies();
  const courseId = cookieStore.get("selectedCourseId")?.value;

  if (!courseId) {
    return NextResponse.json(
      { message: "No course selected" },
      { status: 400 }
    );
  }

  try {
    const headers = Object.fromEntries(request.headers.entries());

    if (!headers["content-type"]?.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { message: "Invalid content type" },
        { status: 400 }
      );
    }

    const bb = Busboy({ headers });
    const fields = {};
    const files = {};

    const processing = new Promise((resolve, reject) => {
      bb.on("file", (name, file, info) => {
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
          files[name] = {
            buffer: Buffer.concat(chunks),
            filename: info.filename,
            mimetype: info.mimeType,
          };
        });
      });

      bb.on("field", (name, value) => {
        fields[name] = value;
      });

      bb.on("error", reject);
      bb.on("finish", resolve);
    });

    const reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bb.write(value);
    }
    bb.end();
    await processing;

    if (!fields.title || !fields.startDate || !fields.endDate) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (files.image) {
      const [oldImage] = await query(
        "SELECT course_image FROM course WHERE course_id = ?",
        [courseId]
      );
      if (oldImage?.course_image) {
        const oldPath = path.join(
          process.cwd(),
          "public",
          oldImage.course_image
        );
        if (fs.existsSync(oldPath)) await fs.promises.unlink(oldPath);
      }

      imageUrl = await uploadFile(files.image.buffer, files.image.filename);
    }

    const result = await query(
      `UPDATE course SET
        course_title = ?,
        course_description = ?,
        course_type = ?,
        start_date = ?,
        end_date = ?,
        course_duration = ?,
        course_image = COALESCE(?, course_image),
        updated_at = NOW()
      WHERE course_id = ?`,
      [
        fields.title,
        fields.description || "",
        fields.visibility || "private",
        fields.startDate,
        fields.endDate,
        calculateDuration(fields.startDate, fields.endDate),
        imageUrl,
        courseId,
      ]
    );

    return NextResponse.json(
      { success: result.affectedRows > 0 },
      { status: result.affectedRows > 0 ? 200 : 404 }
    );
  } catch (error) {
    console.error("Course update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

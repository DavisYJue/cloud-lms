import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import fs from "fs";
import path from "path";
import Busboy from "busboy";

export const config = {
  api: { bodyParser: false },
};

async function saveProfileImage(buffer, filename) {
  const uploadDir = path.join(process.cwd(), "public", "profile");
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const uniqueName = `${Date.now()}-${filename}`;
  await fs.promises.writeFile(path.join(uploadDir, uniqueName), buffer);
  return `/profile/${uniqueName}`;
}

export async function POST(request) {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const bb = Busboy({ headers });
    const fields = {};
    let fileUpload = null;

    const parsing = new Promise((resolve, reject) => {
      bb.on("field", (name, val) => {
        fields[name] = val;
      });
      bb.on("file", (name, fileStream, info) => {
        if (name === "profile_image") {
          const chunks = [];
          fileStream.on("data", (c) => chunks.push(c));
          fileStream.on("end", () => {
            fileUpload = {
              buffer: Buffer.concat(chunks),
              filename: info.filename,
            };
          });
        } else {
          fileStream.resume();
        }
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
    await parsing;

    const username = (fields.username || "").trim();
    const email = (fields.email || "").trim();
    const role = (fields.role || "").trim();
    const password = fields.password || "";
    const telephone = (fields.telephone || "").trim() || null;
    const address = (fields.address || "").trim() || null;
    const bio = (fields.bio || "").trim() || null;

    if (!username || !email || !role || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const studentName = fields.studentName?.trim();
    const className = fields.className?.trim();
    const teacherName = fields.teacherName?.trim();
    const faculty = fields.faculty?.trim();
    const assistantName = fields.assistantName?.trim();
    const department = fields.department?.trim();

    if (role === "student" && (!studentName || !className)) {
      return NextResponse.json(
        { message: "Student name and class are required" },
        { status: 400 },
      );
    }
    if (role === "teacher" && (!teacherName || !faculty)) {
      return NextResponse.json(
        { message: "Teacher name and faculty are required" },
        { status: 400 },
      );
    }
    if (role === "assistant" && (!assistantName || !department)) {
      return NextResponse.json(
        { message: "Assistant name and department are required" },
        { status: 400 },
      );
    }

    let profileImagePath = null;
    if (fileUpload && fileUpload.buffer.length) {
      profileImagePath = await saveProfileImage(
        fileUpload.buffer,
        fileUpload.filename,
      );
    }

    const accountResult = await query(
      `INSERT INTO account 
       (username, email, telephone, address, bio, role, password, profile_image, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        username,
        email,
        telephone,
        address,
        bio,
        role,
        password,
        profileImagePath || null,
      ],
    );
    const accountId = accountResult.insertId;

    switch (role) {
      case "student":
        await query(
          `INSERT INTO student (student_name, class, account_id)
           VALUES (?, ?, ?)`,
          [studentName, className, accountId],
        );
        break;
      case "teacher":
        await query(
          `INSERT INTO teacher (teacher_name, faculty, account_id)
           VALUES (?, ?, ?)`,
          [teacherName, faculty, accountId],
        );
        break;
      case "assistant":
        await query(
          `INSERT INTO assistant (assistant_name, department, account_id)
           VALUES (?, ?, ?)`,
          [assistantName, department, accountId],
        );
        break;
    }

    return NextResponse.json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Account creation error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      if (err.sqlMessage.includes("account.username")) {
        return NextResponse.json(
          { message: "Username already exists." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { message: "Duplicate entry detected." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

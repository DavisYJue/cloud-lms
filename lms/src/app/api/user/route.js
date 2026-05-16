import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import Busboy from "busboy";

const uploadProfileImage = async (fileBuffer, fileName) => {
  const uploadDir = path.join(process.cwd(), "public", "profile");
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const uniqueFileName = `${Date.now()}-${fileName}`;
  const filePath = path.join(uploadDir, uniqueFileName);
  await fs.promises.writeFile(filePath, fileBuffer);
  return `/profile/${uniqueFileName}`;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    const [user] = await query(
      `SELECT account_id, username, email, telephone, address, bio, role, 
       COALESCE(profile_image, '/profile/defaultProfile.webp') AS profile_image
       FROM Account 
       WHERE account_id = ?`,
      [session.account_id]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    const headers = Object.fromEntries(request.headers.entries());
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

    let profileImage = null;
    if (files.profilePicture) {
      const [oldUser] = await query(
        "SELECT profile_image FROM Account WHERE account_id = ?",
        [session.account_id]
      );

      if (
        oldUser?.profile_image &&
        !oldUser.profile_image.includes("defaultProfile")
      ) {
        const oldPath = path.join(
          process.cwd(),
          "public",
          oldUser.profile_image
        );
        if (fs.existsSync(oldPath)) await fs.promises.unlink(oldPath);
      }

      profileImage = await uploadProfileImage(
        files.profilePicture.buffer,
        files.profilePicture.filename
      );
    }

    const updateFields = [];
    const params = [];

    if (fields.username) {
      updateFields.push("username = ?");
      params.push(fields.username);
    }
    if (fields.email) {
      updateFields.push("email = ?");
      params.push(fields.email);
    }
    if (fields.telephone) {
      updateFields.push("telephone = ?");
      params.push(fields.telephone);
    }
    if (fields.address) {
      updateFields.push("address = ?");
      params.push(fields.address);
    }
    if (fields.bio) {
      updateFields.push("bio = ?");
      params.push(fields.bio);
    }
    if (profileImage) {
      updateFields.push("profile_image = ?");
      params.push(profileImage);
    }
    if (fields.newPassword) {
      if (fields.newPassword !== fields.confirmNewPassword) {
        return NextResponse.json(
          { error: "Passwords do not match" },
          { status: 400 }
        );
      }
      updateFields.push("password = ?");
      params.push(fields.newPassword);
    }

    params.push(session.account_id);

    await query(
      `UPDATE Account SET ${updateFields.join(", ")} WHERE account_id = ?`,
      params
    );

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

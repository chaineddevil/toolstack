import { NextResponse, type NextRequest } from "next/server";
import { getUserRole } from "@/lib/auth";
import { uploadBuffer, getPublicUrl, getExtFromMime } from "@/services/storage.service";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // Auth check
  const role = await getUserRole();
  if (!role || !["super_admin", "manager", "editor"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only images are allowed.` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB exceeds 10 MB limit`,
        },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename from MIME type (not original filename)
    const ext = getExtFromMime(file.type);
    const uniqueId = crypto.randomUUID();
    const targetPath = `${folder}/${uniqueId}.${ext}`;

    // Upload
    const path = await uploadBuffer(buffer, targetPath, file.type);
    const publicUrl = getPublicUrl(path);

    return NextResponse.json({ path, publicUrl }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("file");
  const allowed = ["zaitun-cpanel.zip", "Zaitun-Developer-Documentation.docx"];
  if (!filename || !allowed.includes(filename)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  try {
    const filePath = join(process.cwd(), "download", filename);
    const buffer = await readFile(filePath);
    const mimeType = filename.endsWith(".zip") ? "application/zip" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

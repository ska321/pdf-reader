import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure folder exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Read files
    const files = await fs.readdir(uploadDir);

    // Filter only PDFs
    const pdfFiles = files.filter((f) => f.endsWith(".pdf"));

    // Return with public URLs
    const fileUrls = pdfFiles.map((name) => ({
      name,
      url: `/uploads/${name}`,
    }));

    return new Response(JSON.stringify(fileUrls), { status: 200 });
  } catch (err) {
    console.error("List PDFs error:", err);
    return new Response(JSON.stringify({ error: "Failed to list PDFs" }), { status: 500 });
  }
}

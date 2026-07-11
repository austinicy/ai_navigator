import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// Next.js/Turbopack and serverless runtimes cannot reliably discover
// PDF.js's worker path from an externalized package. The package-provided data
// URL is self-contained and works in local Node and deployed route handlers.
PDFParse.setWorker(getData());

export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();

  switch (ext) {
    case "pdf": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

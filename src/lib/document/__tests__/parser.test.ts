import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { parseDocument } from "../parser";

function createTextPdf(text: string): Buffer {
  const content = `BT /F1 16 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

describe("parseDocument", () => {
  it("throws on unsupported file formats", async () => {
    await expect(parseDocument(Buffer.from("hello"), "notes.txt")).rejects.toThrow(
      "Unsupported file format: txt"
    );
  });

  it("throws on unsupported format regardless of case", async () => {
    await expect(
      parseDocument(Buffer.from("x"), "report.XLSX")
    ).rejects.toThrow("Unsupported file format: xlsx");
  });

  it("extracts text from a minimal valid .docx", async () => {
    // Build a minimal valid .docx: a zip containing word/document.xml with a
    // single paragraph. mammoth reads the raw text from the <w:t> runs.
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>AI strategy document for Acme Corp.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
    );
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );
    zip.folder("_rels")?.file(
      ".rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    const buffer = Buffer.from(await zip.generateAsync({ type: "uint8array" }));
    const text = await parseDocument(buffer, "strategy.docx");

    expect(text).toContain("AI strategy document for Acme Corp.");
  });

  it("extracts selectable text from a valid PDF", async () => {
    const text = await parseDocument(
      createTextPdf("AI maturity assessment strategy"),
      "strategy.pdf"
    );

    expect(text).toContain("AI maturity assessment strategy");
  });

  it("rejects legacy .doc because mammoth only supports DOCX", async () => {
    await expect(parseDocument(Buffer.from("legacy"), "legacy.doc")).rejects.toThrow(
      "Unsupported file format: doc"
    );
  });
});

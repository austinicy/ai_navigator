import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { parseDocument } from "../parser";

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

  it("treats .doc extension as docx (mammoth path)", async () => {
    // Same minimal docx content but with a .doc filename. The extension switch
    // routes both .doc and .docx to mammoth.extractRawText.
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>Legacy doc text.</w:t></w:r></w:p></w:body>
</w:document>`
    );
    const buffer = Buffer.from(await zip.generateAsync({ type: "uint8array" }));
    const text = await parseDocument(buffer, "legacy.doc");

    expect(text).toContain("Legacy doc text.");
  });
});

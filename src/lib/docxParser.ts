import mammoth from "mammoth";

export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing docx:", error);
    throw new Error("Failed to parse .docx file");
  }
}

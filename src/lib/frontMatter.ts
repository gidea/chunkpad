import { ChunkMetadata } from "@/types";

export function parseFrontMatter(content: string): {
  metadata: ChunkMetadata;
  content: string;
} {
  console.log("parseFrontMatter called with content:", content.substring(0, 200));
  
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    console.log("No front matter found");
    return { metadata: {}, content };
  }

  const [, frontMatterStr, contentWithoutFrontMatter] = match;
  const metadata: ChunkMetadata = {};

  console.log("Front matter string found:", frontMatterStr);

  // Parse front matter lines
  const lines = frontMatterStr.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      if (key && value) {
        metadata[key] = value;
      }
    }
  }

  console.log("Parsed metadata:", metadata);

  return { metadata, content: contentWithoutFrontMatter };
}

export function stringifyFrontMatter(
  metadata: ChunkMetadata,
  content: string
): string {
  console.log("stringifyFrontMatter called with metadata:", metadata);
  
  const metadataEntries = Object.entries(metadata).filter(([_, value]) => value);
  
  console.log("Filtered metadata entries:", metadataEntries);
  
  if (metadataEntries.length === 0) {
    return content;
  }

  const frontMatter = metadataEntries
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const result = `---\n${frontMatter}\n---\n\n${content}`;
  console.log("stringifyFrontMatter result:", result.substring(0, 200));
  
  return result;
}

import { ChunkMetadata } from "@/types";

export function parseFrontMatter(content: string): {
  metadata: ChunkMetadata;
  content: string;
} {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const [, frontMatterStr, contentWithoutFrontMatter] = match;
  const metadata: ChunkMetadata = {};

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

  return { metadata, content: contentWithoutFrontMatter };
}

export function stringifyFrontMatter(
  metadata: ChunkMetadata,
  content: string
): string {
  const metadataEntries = Object.entries(metadata).filter(([_, value]) => value);
  
  if (metadataEntries.length === 0) {
    return content;
  }

  const frontMatter = metadataEntries
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${frontMatter}\n---\n\n${content}`;
}

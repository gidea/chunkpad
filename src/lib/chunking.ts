import { Chunk, GlobalMetadata } from "@/types";
import { countTokens } from "./chunking/utils";
import { htmlToDocumentBlocks } from "./document/parser";
import { getStrategy } from "./chunking/registry";

// Ensure strategies are initialized
import "./chunking/index";

// Re-export for backward compatibility
export { countTokens };

// Re-export strategy registry functions
export { getAllStrategies, getStrategy, registerStrategy, hasStrategy } from "./chunking/registry";
export type { ChunkingStrategy, ChunkingOptions } from "./chunking/strategy";

/**
 * Legacy chunkDocument function - maintained for backward compatibility
 * 
 * @deprecated Use strategy-based chunking via getStrategy("fixed-size").chunk() instead
 * This function now delegates to the fixed-size strategy.
 */
export function chunkDocument(
  content: string,
  targetChunkSize: number = 1000,
  overlapSize: number = 150,
  globalMetadata: GlobalMetadata = {}
): Chunk[] {
  // Use fixed-size strategy for backward compatibility
  const strategy = getStrategy("fixed-size");
  if (!strategy) {
    throw new Error("Fixed-size strategy not registered. Please ensure strategies are initialized.");
  }
  
  // Convert HTML to DocumentStructure (infer source type from content)
  // For legacy usage, we'll assume it's from a generic source
  const structure = htmlToDocumentBlocks(content, "docx", "document");
  
  // Use strategy with provided options
  return strategy.chunk(structure, {
    maxTokens: targetChunkSize,
    overlapTokens: overlapSize,
  }, globalMetadata);
}

export function rechunkDocument(
  chunks: Chunk[],
  targetChunkSize: number,
  overlapSize: number,
  globalMetadata: GlobalMetadata = {}
): Chunk[] {
  // Combine all chunks back into single document (preserve HTML)
  const fullContent = chunks.map(c => c.content).join("\n");
  
  // Re-chunk with new settings
  return chunkDocument(fullContent, targetChunkSize, overlapSize, globalMetadata);
}

export function formatChunkWithFrontMatter(
  chunk: Chunk,
  globalMetadata: GlobalMetadata = {}
): string {
  const allMetadata = { ...globalMetadata, ...chunk.metadata };
  
  if (Object.keys(allMetadata).length === 0) {
    return chunk.content;
  }

  const frontMatter = Object.entries(allMetadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${frontMatter}\n---\n\n${chunk.content}`;
}

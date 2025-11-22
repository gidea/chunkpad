import { encoding_for_model } from "tiktoken";
import { Chunk, GlobalMetadata } from "@/types";

const encoder = encoding_for_model("gpt-3.5-turbo");

export function countTokens(text: string): number {
  const tokens = encoder.encode(text);
  return tokens.length;
}

export function chunkDocument(
  content: string,
  targetChunkSize: number = 1000,
  overlapSize: number = 150,
  globalMetadata: GlobalMetadata = {}
): Chunk[] {
  const chunks: Chunk[] = [];
  
  // For HTML content, split by block-level elements while preserving tags
  const blockElements = content.split(/(<\/(?:p|h[1-6]|div|section|table|ul|ol|blockquote)>)/i).filter(p => p.trim());
  
  let currentChunk = "";
  let currentTokens = 0;
  let chunkNumber = 1;
  
  // Reconstruct proper HTML blocks
  const htmlBlocks: string[] = [];
  for (let i = 0; i < blockElements.length; i += 2) {
    if (i + 1 < blockElements.length) {
      htmlBlocks.push(blockElements[i] + blockElements[i + 1]);
    } else if (blockElements[i].trim()) {
      htmlBlocks.push(blockElements[i]);
    }
  }
  
  for (let i = 0; i < htmlBlocks.length; i++) {
    const block = htmlBlocks[i].trim();
    const blockTokens = countTokens(block);
    
    // If single block exceeds target, split it while preserving HTML structure
    if (blockTokens > targetChunkSize) {
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, chunkNumber++, globalMetadata));
        currentChunk = "";
        currentTokens = 0;
      }
      
      // For oversized blocks, try to split by sentences within HTML tags
      const textContent = block.replace(/<[^>]*>/g, '');
      const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
      
      if (sentences.length > 1) {
        let sentenceBuffer = "";
        let sentenceTokens = 0;
        
        for (const sentence of sentences) {
          const tokens = countTokens(sentence);
          if (sentenceTokens + tokens > targetChunkSize && sentenceBuffer) {
            chunks.push(createChunk(sentenceBuffer, chunkNumber++, globalMetadata));
            sentenceBuffer = sentence;
            sentenceTokens = tokens;
          } else {
            sentenceBuffer += (sentenceBuffer ? " " : "") + sentence;
            sentenceTokens += tokens;
          }
        }
        
        if (sentenceBuffer) {
          currentChunk = sentenceBuffer;
          currentTokens = sentenceTokens;
        }
      } else {
        // Block is too large but can't be split further, add as is
        chunks.push(createChunk(block, chunkNumber++, globalMetadata));
      }
      continue;
    }
    
    // Check if adding this block exceeds target
    if (currentTokens + blockTokens > targetChunkSize && currentChunk) {
      chunks.push(createChunk(currentChunk, chunkNumber++, globalMetadata));
      
      // Add overlap from previous chunk (preserve HTML structure)
      const words = currentChunk.split(/\s+/);
      const overlapText = words.slice(-Math.floor(overlapSize / 2)).join(" ");
      currentChunk = overlapText + "\n" + block;
      currentTokens = countTokens(currentChunk);
    } else {
      currentChunk += (currentChunk ? "\n" : "") + block;
      currentTokens += blockTokens;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk, chunkNumber, globalMetadata));
  }
  
  return chunks;
}

function createChunk(content: string, number: number, globalMetadata: GlobalMetadata = {}): Chunk {
  const tokens = countTokens(content);
  
  // Strip HTML tags for preview
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const preview = textContent.slice(0, 100) || "Empty content...";
  
  // Extract title from first HTML heading or create generic one
  const headingMatch = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
  const title = headingMatch 
    ? `Chunk ${number}: ${headingMatch[1]}`
    : `Chunk ${number}: Section`;
  
  return {
    id: `chunk-${number}-${Date.now()}`,
    title,
    preview,
    content,
    tokens,
    metadata: {},
  };
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

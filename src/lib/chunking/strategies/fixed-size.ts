/**
 * Fixed-size chunking strategy
 * 
 * Token-based chunking with configurable size and overlap.
 * Respects HTML block boundaries but doesn't leverage heading hierarchy.
 * This is a refactored version of the original chunkDocument function.
 */

import { Chunk, GlobalMetadata } from "@/types";
import { DocumentStructure } from "@/types/document";
import { ChunkingStrategy, ChunkingOptions } from "../strategy";
import { countTokens } from "../utils";

export class FixedSizeStrategy implements ChunkingStrategy {
  id = "fixed-size";
  name = "Fixed Size";
  description = "Token-based chunking with configurable size and overlap. Respects HTML block boundaries.";
  
  defaultOptions: ChunkingOptions = {
    maxTokens: 1000,
    overlapTokens: 150,
    preserveStructure: true,
  };
  
  chunk(
    structure: DocumentStructure,
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const maxTokens = opts.maxTokens ?? 1000;
    const overlapTokens = opts.overlapTokens ?? 150;
    
    const chunks: Chunk[] = [];
    
    // Convert DocumentStructure back to HTML blocks for processing
    // This maintains backward compatibility with the original implementation
    const htmlBlocks: string[] = [];
    for (const block of structure.blocks) {
      htmlBlocks.push(block.html);
    }
    
    let currentChunk = "";
    let currentTokens = 0;
    let chunkNumber = 1;
    
    for (let i = 0; i < htmlBlocks.length; i++) {
      const block = htmlBlocks[i].trim();
      const blockTokens = countTokens(block);
      
      // If single block exceeds target, split it while preserving HTML structure
      if (blockTokens > maxTokens) {
        if (currentChunk) {
          chunks.push(this.createChunk(currentChunk, chunkNumber++, globalMetadata, structure, opts));
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
            if (sentenceTokens + tokens > maxTokens && sentenceBuffer) {
              chunks.push(this.createChunk(sentenceBuffer, chunkNumber++, globalMetadata, structure, opts));
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
          chunks.push(this.createChunk(block, chunkNumber++, globalMetadata, structure, opts));
        }
        continue;
      }
      
      // Check if adding this block exceeds target
      if (currentTokens + blockTokens > maxTokens && currentChunk) {
        chunks.push(this.createChunk(currentChunk, chunkNumber++, globalMetadata, structure, opts));
        
        // Add overlap from previous chunk (preserve HTML structure)
        const words = currentChunk.split(/\s+/);
        const overlapText = words.slice(-Math.floor(overlapTokens / 2)).join(" ");
        currentChunk = overlapText + "\n" + block;
        currentTokens = countTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? "\n" : "") + block;
        currentTokens += blockTokens;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(this.createChunk(currentChunk, chunkNumber, globalMetadata, structure, opts));
    }
    
    return chunks;
  }
  
  private createChunk(
    content: string,
    number: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk {
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
      metadata: {
        strategy: this.id,
        strategyOptions: options,
        sourceFile: structure.sourceFile,
      },
    };
  }
  
  validateOptions(options: ChunkingOptions): boolean {
    if (options.maxTokens !== undefined && (options.maxTokens < 1 || options.maxTokens > 10000)) {
      return false;
    }
    if (options.overlapTokens !== undefined && (options.overlapTokens < 0 || options.overlapTokens > 1000)) {
      return false;
    }
    if (options.maxTokens && options.overlapTokens && options.overlapTokens >= options.maxTokens) {
      return false;
    }
    return true;
  }
}


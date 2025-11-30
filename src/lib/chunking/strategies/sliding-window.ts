/**
 * Sliding window chunking strategy
 * 
 * Creates overlapping chunks with configurable window size and overlap.
 * Useful when important context spans boundaries.
 */

import { Chunk, GlobalMetadata } from "@/types";
import { DocumentStructure } from "@/types/document";
import { ChunkingStrategy, ChunkingOptions } from "../strategy";
import { countTokens } from "../utils";

export class SlidingWindowStrategy implements ChunkingStrategy {
  id = "sliding-window";
  name = "Sliding Window";
  description = "Creates overlapping chunks with configurable window and overlap sizes. Best for technical documents where context spanning boundaries is important.";
  
  defaultOptions: ChunkingOptions = {
    windowSize: 1000,      // Size of each window in tokens
    overlapSize: 200,      // Overlap between windows in tokens
    preserveWordBoundaries: true,
    preserveSentenceBoundaries: false,
  };
  
  chunk(
    structure: DocumentStructure,
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const windowSize = opts.windowSize ?? 1000;
    const overlapSize = opts.overlapSize ?? 200;
    const preserveWordBoundaries = opts.preserveWordBoundaries ?? true;
    const preserveSentenceBoundaries = opts.preserveSentenceBoundaries ?? false;
    
    // Store merged options for use in createChunk
    const mergedOptions = opts;
    
    // Convert document structure to continuous text stream
    const textStream = this.buildTextStream(structure);
    
    if (textStream.length === 0) {
      return [];
    }
    
    // Calculate total tokens
    const totalTokens = countTokens(textStream);
    
    // If document fits in one window, return single chunk
    if (totalTokens <= windowSize) {
      return [this.createChunk(
        this.buildHTMLFromText(textStream, structure),
        1,
        0,
        globalMetadata,
        structure,
        mergedOptions
      )];
    }
    
    const chunks: Chunk[] = [];
    const stepSize = windowSize - overlapSize;
    
    // Use token-based positioning for accuracy
    const tokens = this.tokenizeText(textStream);
    let position = 0;
    let chunkNumber = 1;
    
    while (position < tokens.length) {
      // Calculate window end position
      let windowEnd = Math.min(position + windowSize, tokens.length);
      
      // Adjust boundaries if needed
      if (preserveSentenceBoundaries && windowEnd < tokens.length) {
        windowEnd = this.findSentenceBoundary(tokens, windowEnd, position);
      } else if (preserveWordBoundaries && windowEnd < tokens.length) {
        windowEnd = this.findWordBoundary(tokens, windowEnd, position);
      }
      
      // Extract text for this window
      const windowTokens = tokens.slice(position, windowEnd);
      const windowText = this.detokenize(windowTokens);
      const windowHTML = this.buildHTMLFromText(windowText, structure);
      
      chunks.push(this.createChunk(
        windowHTML,
        chunkNumber++,
        position,
        globalMetadata,
        structure,
        mergedOptions
      ));
      
      // Move to next window
      position += stepSize;
      
      // Ensure we make progress (avoid infinite loop)
      if (chunks.length > 0 && chunks[chunks.length - 1].metadata?.windowIndex !== undefined) {
        const lastWindowIndex = chunks[chunks.length - 1].metadata.windowIndex as number;
        if (position <= lastWindowIndex) {
          position = lastWindowIndex + 1;
        }
      }
    }
    
    return chunks;
  }
  
  private buildTextStream(structure: DocumentStructure): string {
    // Combine all blocks into a continuous text stream
    // Preserve some structure with newlines
    return structure.blocks
      .map(block => block.text)
      .filter(text => text.trim().length > 0)
      .join("\n\n");
  }
  
  private buildHTMLFromText(text: string, structure: DocumentStructure): string {
    // Convert text back to HTML paragraphs
    // This is a simplified version - in practice, we'd want to preserve more structure
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join("\n");
  }
  
  private tokenizeText(text: string): string[] {
    // Split text into tokens (words and punctuation)
    // This is a simplified tokenization - tiktoken does the actual counting
    // For boundary detection, we use word-level granularity
    const words: string[] = [];
    const regex = /\S+/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      words.push(match[0]);
    }
    
    return words;
  }
  
  private detokenize(tokens: string[]): string {
    return tokens.join(" ");
  }
  
  private findSentenceBoundary(tokens: string[], position: number, start: number): number {
    // Look backwards from position to find sentence boundary
    // Sentence boundaries are tokens ending with . ! or ?
    for (let i = position - 1; i >= start; i--) {
      const token = tokens[i];
      if (/[.!?]$/.test(token)) {
        return i + 1;
      }
    }
    // If no sentence boundary found, look forward
    for (let i = position; i < tokens.length; i++) {
      const token = tokens[i];
      if (/[.!?]$/.test(token)) {
        return i + 1;
      }
    }
    return position;
  }
  
  private findWordBoundary(tokens: string[], position: number, start: number): number {
    // Word boundaries are already at token level, so just return position
    // But ensure we don't break in the middle of a word (which shouldn't happen with our tokenization)
    return position;
  }
  
  private createChunk(
    content: string,
    number: number,
    windowIndex: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk {
    const tokens = countTokens(content);
    
    // Strip HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const preview = textContent.slice(0, 100) || "Empty content...";
    
    // Extract title from first few words
    const firstWords = textContent.split(/\s+/).slice(0, 5).join(" ");
    const title = `Chunk ${number}: ${firstWords}${textContent.length > firstWords.length ? "..." : ""}`;
    
    // Get metadata from first block
    const firstBlock = structure.blocks[0];
    const page = firstBlock?.metadata?.page;
    const slide = firstBlock?.metadata?.slide;
    
    return {
      id: `chunk-${number}-${Date.now()}`,
      title,
      preview,
      content,
      tokens,
      metadata: {
        strategy: this.id,
        strategyOptions: options,
        windowIndex,
        sourceFile: structure.sourceFile,
        page,
        slide,
      },
    };
  }
  
  validateOptions(options: ChunkingOptions): boolean {
    if (options.windowSize !== undefined && (options.windowSize < 1 || options.windowSize > 10000)) {
      return false;
    }
    if (options.overlapSize !== undefined && (options.overlapSize < 0 || options.overlapSize > 5000)) {
      return false;
    }
    if (options.windowSize && options.overlapSize && options.overlapSize >= options.windowSize) {
      return false;
    }
    return true;
  }
}


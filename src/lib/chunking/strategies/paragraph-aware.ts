/**
 * Paragraph-aware (recursive) chunking strategy
 * 
 * Recursive splitting strategy that tries paragraph-level chunks first,
 * falls back to sentence-level, then token-level if needed.
 * Maintains paragraph coherence and never splits mid-sentence.
 */

import { Chunk, GlobalMetadata } from "@/types";
import { DocumentStructure, DocumentBlock } from "@/types/document";
import { ChunkingStrategy, ChunkingOptions } from "../strategy";
import { countTokens } from "../utils";

export class ParagraphAwareStrategy implements ChunkingStrategy {
  id = "paragraph-aware";
  name = "Paragraph-Aware";
  description = "Groups paragraphs together, falling back to sentence or token-level splitting if needed. Best for narrative content.";
  
  defaultOptions: ChunkingOptions = {
    maxTokens: 1000,
    overlapTokens: 150,
    minParagraphsPerChunk: 1,
    maxParagraphsPerChunk: 10,
    preserveParagraphBoundaries: true,
  };
  
  chunk(
    structure: DocumentStructure,
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const maxTokens = opts.maxTokens ?? 1000;
    const overlapTokens = opts.overlapTokens ?? 150;
    const minParagraphs = opts.minParagraphsPerChunk ?? 1;
    const maxParagraphs = opts.maxParagraphsPerChunk ?? 10;
    
    // Store merged options for use in createChunk
    const mergedOptions = opts;
    
    const chunks: Chunk[] = [];
    let chunkNumber = 1;
    
    // Filter to paragraph-level blocks (paragraphs, list items, etc.)
    const paragraphBlocks = structure.blocks.filter(block => 
      block.type === "paragraph" || 
      block.type === "listItem" ||
      block.type === "other"
    );
    
    let currentChunkBlocks: DocumentBlock[] = [];
    let currentTokens = 0;
    
    for (const block of paragraphBlocks) {
      const blockTokens = countTokens(block.html);
      
      // If single paragraph exceeds maxTokens, need to split it
      if (blockTokens > maxTokens) {
        // Save current chunk if any
        if (currentChunkBlocks.length > 0) {
          chunks.push(this.createChunk(
            currentChunkBlocks,
            chunkNumber++,
            globalMetadata,
            structure,
            mergedOptions
          ));
          currentChunkBlocks = [];
          currentTokens = 0;
        }
        
        // Split oversized paragraph
        const subChunks = this.splitOversizedBlock(block, maxTokens, overlapTokens, chunkNumber, globalMetadata, structure, mergedOptions);
        chunks.push(...subChunks);
        chunkNumber += subChunks.length;
        continue;
      }
      
      // Check if adding this paragraph would exceed maxTokens or maxParagraphs
      const wouldExceedTokens = currentTokens + blockTokens > maxTokens;
      const wouldExceedParagraphs = currentChunkBlocks.length >= maxParagraphs;
      
      if ((wouldExceedTokens || wouldExceedParagraphs) && currentChunkBlocks.length >= minParagraphs) {
        // Create chunk from current blocks
        chunks.push(this.createChunk(
          currentChunkBlocks,
          chunkNumber++,
          globalMetadata,
          structure,
          mergedOptions
        ));
        
        // Start new chunk with overlap if configured
        if (overlapTokens > 0 && currentChunkBlocks.length > 0) {
          const overlapBlocks = this.getOverlapBlocks(currentChunkBlocks, overlapTokens);
          currentChunkBlocks = [...overlapBlocks, block];
          currentTokens = countTokens(this.buildContentFromBlocks(currentChunkBlocks));
        } else {
          currentChunkBlocks = [block];
          currentTokens = blockTokens;
        }
      } else {
        // Add block to current chunk
        currentChunkBlocks.push(block);
        currentTokens += blockTokens;
      }
    }
    
    // Add final chunk
    if (currentChunkBlocks.length > 0) {
      chunks.push(this.createChunk(
        currentChunkBlocks,
        chunkNumber,
        globalMetadata,
        structure,
        mergedOptions
      ));
    }
    
    return chunks;
  }
  
  private splitOversizedBlock(
    block: DocumentBlock,
    maxTokens: number,
    overlapTokens: number,
    startChunkNumber: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk[] {
    const text = block.text;
    const chunks: Chunk[] = [];
    let chunkNumber = startChunkNumber;
    
    // Try sentence-level splitting first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length > 1) {
      // Split by sentences
      let currentSentences: string[] = [];
      let currentTokens = 0;
      
      for (const sentence of sentences) {
        const sentenceTokens = countTokens(sentence);
        
        if (currentTokens + sentenceTokens > maxTokens && currentSentences.length > 0) {
          // Create chunk from sentences
          const content = currentSentences.map(s => `<p>${s.trim()}</p>`).join("\n");
          chunks.push(this.createChunkFromContent(
            content,
            chunkNumber++,
            globalMetadata,
            structure,
            block,
            options
          ));
          
          // Start new chunk with overlap
          if (overlapTokens > 0) {
            const overlapSentences = this.getOverlapSentences(currentSentences, overlapTokens);
            currentSentences = [...overlapSentences, sentence];
            currentTokens = countTokens(currentSentences.join(" "));
          } else {
            currentSentences = [sentence];
            currentTokens = sentenceTokens;
          }
        } else {
          currentSentences.push(sentence);
          currentTokens += sentenceTokens;
        }
      }
      
      // Add final chunk
      if (currentSentences.length > 0) {
        const content = currentSentences.map(s => `<p>${s.trim()}</p>`).join("\n");
        chunks.push(this.createChunkFromContent(
          content,
          chunkNumber,
          globalMetadata,
          structure,
          block,
          options
        ));
      }
    } else {
      // Can't split by sentences, fall back to token-level
      return this.splitByTokens(block, maxTokens, overlapTokens, startChunkNumber, globalMetadata, structure, options);
    }
    
    return chunks;
  }
  
  private splitByTokens(
    block: DocumentBlock,
    maxTokens: number,
    overlapTokens: number,
    startChunkNumber: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk[] {
    const text = block.text;
    const words = text.split(/\s+/);
    const chunks: Chunk[] = [];
    let chunkNumber = startChunkNumber;
    
    let currentWords: string[] = [];
    let currentTokens = 0;
    
    for (const word of words) {
      const wordTokens = countTokens(word + " ");
      
      if (currentTokens + wordTokens > maxTokens && currentWords.length > 0) {
        // Create chunk
        const content = `<p>${currentWords.join(" ")}</p>`;
        chunks.push(this.createChunkFromContent(
          content,
          chunkNumber++,
          globalMetadata,
          structure,
          block,
          options
        ));
        
        // Start new chunk with overlap
        if (overlapTokens > 0) {
          const overlapWords = this.getOverlapWords(currentWords, overlapTokens);
          currentWords = [...overlapWords, word];
          currentTokens = countTokens(currentWords.join(" "));
        } else {
          currentWords = [word];
          currentTokens = wordTokens;
        }
      } else {
        currentWords.push(word);
        currentTokens += wordTokens;
      }
    }
    
    // Add final chunk
    if (currentWords.length > 0) {
      const content = `<p>${currentWords.join(" ")}</p>`;
      chunks.push(this.createChunkFromContent(
        content,
        chunkNumber,
        globalMetadata,
        structure,
        block,
        options
      ));
    }
    
    return chunks;
  }
  
  private getOverlapBlocks(blocks: DocumentBlock[], overlapTokens: number): DocumentBlock[] {
    const overlapBlocks: DocumentBlock[] = [];
    let overlapTokenCount = 0;
    
    for (let i = blocks.length - 1; i >= 0; i--) {
      const blockTokens = countTokens(blocks[i].html);
      if (overlapTokenCount + blockTokens <= overlapTokens) {
        overlapBlocks.unshift(blocks[i]);
        overlapTokenCount += blockTokens;
      } else {
        break;
      }
    }
    
    return overlapBlocks.length > 0 ? overlapBlocks : [blocks[blocks.length - 1]];
  }
  
  private getOverlapSentences(sentences: string[], overlapTokens: number): string[] {
    const overlapSentences: string[] = [];
    let overlapTokenCount = 0;
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = countTokens(sentences[i]);
      if (overlapTokenCount + sentenceTokens <= overlapTokens) {
        overlapSentences.unshift(sentences[i]);
        overlapTokenCount += sentenceTokens;
      } else {
        break;
      }
    }
    
    return overlapSentences.length > 0 ? overlapSentences : [sentences[sentences.length - 1]];
  }
  
  private getOverlapWords(words: string[], overlapTokens: number): string[] {
    const overlapWords: string[] = [];
    let overlapTokenCount = 0;
    
    for (let i = words.length - 1; i >= 0; i--) {
      const wordTokens = countTokens(words[i] + " ");
      if (overlapTokenCount + wordTokens <= overlapTokens) {
        overlapWords.unshift(words[i]);
        overlapTokenCount += wordTokens;
      } else {
        break;
      }
    }
    
    return overlapWords.length > 0 ? overlapWords : [words[words.length - 1]];
  }
  
  private buildContentFromBlocks(blocks: DocumentBlock[]): string {
    return blocks.map(b => b.html).join("\n");
  }
  
  private createChunk(
    blocks: DocumentBlock[],
    number: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk {
    const content = this.buildContentFromBlocks(blocks);
    return this.createChunkFromContent(content, number, globalMetadata, structure, blocks[0], options);
  }
  
  private createChunkFromContent(
    content: string,
    number: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    firstBlock: DocumentBlock,
    options: ChunkingOptions
  ): Chunk {
    const tokens = countTokens(content);
    
    // Strip HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const preview = textContent.slice(0, 100) || "Empty content...";
    
    // Extract title from first block or create generic one
    let title: string;
    if (firstBlock.type === "heading" || firstBlock.type === "slideTitle") {
      title = `Chunk ${number}: ${firstBlock.text}`;
    } else {
      // Use first few words of first paragraph
      const firstWords = textContent.split(/\s+/).slice(0, 5).join(" ");
      title = `Chunk ${number}: ${firstWords}${textContent.length > firstWords.length ? "..." : ""}`;
    }
    
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
        sourceFile: structure.sourceFile,
        page,
        slide,
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
    if (options.minParagraphsPerChunk !== undefined && options.minParagraphsPerChunk < 1) {
      return false;
    }
    if (options.maxParagraphsPerChunk !== undefined && options.maxParagraphsPerChunk < 1) {
      return false;
    }
    if (options.minParagraphsPerChunk && options.maxParagraphsPerChunk && 
        options.minParagraphsPerChunk > options.maxParagraphsPerChunk) {
      return false;
    }
    return true;
  }
}


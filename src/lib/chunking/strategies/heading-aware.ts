/**
 * Heading-aware chunking strategy
 * 
 * Groups content under headings, creating chunks that start at heading boundaries.
 * Preserves section hierarchy and includes heading path in metadata.
 */

import { Chunk, GlobalMetadata } from "@/types";
import { DocumentStructure, DocumentBlock } from "@/types/document";
import { ChunkingStrategy, ChunkingOptions } from "../strategy";
import { countTokens } from "../utils";

interface Section {
  heading: DocumentBlock | null;
  blocks: DocumentBlock[];
  level: number;
  sectionPath: string[];
}

export class HeadingAwareStrategy implements ChunkingStrategy {
  id = "heading-aware";
  name = "Heading-Aware";
  description = "Groups content under headings, preserving document hierarchy. Best for structured documents with clear sections.";
  
  defaultOptions: ChunkingOptions = {
    maxTokens: 1000,
    overlapTokens: 150,
    minChunkTokens: 200,
    preserveStructure: true,
    subChunkingStrategy: "paragraph", // "paragraph" | "sentence"
  };
  
  chunk(
    structure: DocumentStructure,
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const maxTokens = opts.maxTokens ?? 1000;
    const overlapTokens = opts.overlapTokens ?? 150;
    const minChunkTokens = opts.minChunkTokens ?? 200;
    const subChunkingStrategy = opts.subChunkingStrategy ?? "paragraph";
    
    // Build section hierarchy
    const sections = this.buildSections(structure.blocks);
    
    // If no headings found, fallback to paragraph-aware chunking
    if (sections.length === 0 || sections.every(s => s.heading === null)) {
      return this.fallbackToParagraphChunking(structure, opts, globalMetadata);
    }
    
    const chunks: Chunk[] = [];
    let chunkNumber = 1;
    
    for (const section of sections) {
      const sectionChunks = this.chunkSection(
        section,
        maxTokens,
        overlapTokens,
        minChunkTokens,
        subChunkingStrategy as string,
        chunkNumber,
        globalMetadata,
        structure,
        opts
      );
      
      chunks.push(...sectionChunks);
      chunkNumber += sectionChunks.length;
    }
    
    return chunks;
  }
  
  private buildSections(blocks: DocumentBlock[]): Section[] {
    const sections: Section[] = [];
    const headingStack: Array<{ block: DocumentBlock; sectionPath: string[] }> = [];
    
    let currentSection: Section | null = null;
    
    for (const block of blocks) {
      // Check if this is a heading
      if (block.type === "heading" || block.type === "slideTitle") {
        const level = block.level ?? 1;
        const headingText = block.text;
        
        // Pop headings from stack that are at same or deeper level
        while (headingStack.length > 0 && (headingStack[headingStack.length - 1].block.level ?? 1) >= level) {
          headingStack.pop();
        }
        
        // Build section path
        const sectionPath = [...headingStack.map(h => h.block.text), headingText];
        
        // Save current section if it has content
        if (currentSection && currentSection.blocks.length > 0) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          heading: block,
          blocks: [],
          level,
          sectionPath,
        };
        
        // Add to heading stack
        headingStack.push({ block, sectionPath });
      } else {
        // Add block to current section
        if (!currentSection) {
          // No heading yet, create a root section
          currentSection = {
            heading: null,
            blocks: [],
            level: 0,
            sectionPath: [],
          };
        }
        currentSection.blocks.push(block);
      }
    }
    
    // Add final section
    if (currentSection && currentSection.blocks.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  private chunkSection(
    section: Section,
    maxTokens: number,
    overlapTokens: number,
    minChunkTokens: number,
    subChunkingStrategy: string,
    startChunkNumber: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk[] {
    const chunks: Chunk[] = [];
    
    // Calculate total tokens in section
    const sectionText = section.blocks.map(b => b.text).join(" ");
    const sectionTokens = countTokens(sectionText);
    
    // If section fits in one chunk, create single chunk
    if (sectionTokens <= maxTokens) {
      const content = this.buildSectionContent(section);
      chunks.push(this.createChunk(
        content,
        startChunkNumber,
        section.sectionPath,
        section,
        globalMetadata,
        structure,
        options
      ));
      return chunks;
    }
    
    // Section is too large, need to sub-chunk
    if (subChunkingStrategy === "sentence") {
      return this.chunkSectionBySentences(
        section,
        maxTokens,
        overlapTokens,
        startChunkNumber,
        globalMetadata,
        structure,
        options
      );
    } else {
      // Default: paragraph-based sub-chunking
      return this.chunkSectionByParagraphs(
        section,
        maxTokens,
        overlapTokens,
        startChunkNumber,
        globalMetadata,
        structure,
        options
      );
    }
  }
  
  private chunkSectionByParagraphs(
    section: Section,
    maxTokens: number,
    overlapTokens: number,
    startChunkNumber: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkNumber = startChunkNumber;
    
    let currentChunkBlocks: DocumentBlock[] = [];
    let currentTokens = 0;
    
    // Include heading in first chunk
    if (section.heading) {
      const headingTokens = countTokens(section.heading.html);
      currentChunkBlocks.push(section.heading);
      currentTokens += headingTokens;
    }
    
    for (const block of section.blocks) {
      const blockTokens = countTokens(block.html);
      
      // Check if adding this block would exceed maxTokens
      if (currentTokens + blockTokens > maxTokens && currentChunkBlocks.length > 0) {
        // Create chunk from current blocks
        const content = this.buildContentFromBlocks(currentChunkBlocks);
        chunks.push(this.createChunk(
          content,
          chunkNumber++,
          section.sectionPath,
          section,
          globalMetadata,
          structure,
          options
        ));
        
        // Start new chunk with overlap
        if (overlapTokens > 0 && currentChunkBlocks.length > 0) {
          // Add last block(s) as overlap
          const overlapBlocks = this.getOverlapBlocks(currentChunkBlocks, overlapTokens);
          currentChunkBlocks = [...overlapBlocks, block];
          currentTokens = countTokens(this.buildContentFromBlocks(currentChunkBlocks));
        } else {
          currentChunkBlocks = [block];
          currentTokens = blockTokens;
        }
      } else {
        currentChunkBlocks.push(block);
        currentTokens += blockTokens;
      }
    }
    
    // Add final chunk
    if (currentChunkBlocks.length > 0) {
      const content = this.buildContentFromBlocks(currentChunkBlocks);
      chunks.push(this.createChunk(
        content,
        chunkNumber,
        section.sectionPath,
        section,
        globalMetadata,
        structure,
        options
      ));
    }
    
    return chunks;
  }
  
  private chunkSectionBySentences(
    section: Section,
    maxTokens: number,
    overlapTokens: number,
    startChunkNumber: number,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk[] {
    // Convert blocks to sentences
    const sentences: Array<{ text: string; html: string; block: DocumentBlock }> = [];
    
    for (const block of section.blocks) {
      const text = block.text;
      const sentenceMatches = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      for (const sentenceText of sentenceMatches) {
        sentences.push({
          text: sentenceText.trim(),
          html: `<p>${sentenceText.trim()}</p>`,
          block,
        });
      }
    }
    
    const chunks: Chunk[] = [];
    let chunkNumber = startChunkNumber;
    
    let currentChunkContent: string[] = [];
    let currentTokens = 0;
    
    // Include heading in first chunk
    if (section.heading) {
      currentChunkContent.push(section.heading.html);
      currentTokens += countTokens(section.heading.html);
    }
    
    for (const sentence of sentences) {
      const sentenceTokens = countTokens(sentence.text);
      
      if (currentTokens + sentenceTokens > maxTokens && currentChunkContent.length > 0) {
        // Create chunk
        const content = currentChunkContent.join("\n");
        chunks.push(this.createChunk(
          content,
          chunkNumber++,
          section.sectionPath,
          section,
          globalMetadata,
          structure,
          options
        ));
        
        // Start new chunk with overlap
        if (overlapTokens > 0) {
          const overlapSentences = this.getOverlapSentences(currentChunkContent, overlapTokens);
          currentChunkContent = [...overlapSentences, sentence.html];
          currentTokens = countTokens(currentChunkContent.join("\n"));
        } else {
          currentChunkContent = [sentence.html];
          currentTokens = sentenceTokens;
        }
      } else {
        currentChunkContent.push(sentence.html);
        currentTokens += sentenceTokens;
      }
    }
    
    // Add final chunk
    if (currentChunkContent.length > 0) {
      const content = currentChunkContent.join("\n");
      chunks.push(this.createChunk(
        content,
        chunkNumber,
        section.sectionPath,
        section,
        globalMetadata,
        structure,
        options
      ));
    }
    
    return chunks;
  }
  
  private buildSectionContent(section: Section): string {
    const parts: string[] = [];
    if (section.heading) {
      parts.push(section.heading.html);
    }
    parts.push(...section.blocks.map(b => b.html));
    return parts.join("\n");
  }
  
  private buildContentFromBlocks(blocks: DocumentBlock[]): string {
    return blocks.map(b => b.html).join("\n");
  }
  
  private getOverlapBlocks(blocks: DocumentBlock[], overlapTokens: number): DocumentBlock[] {
    // Get last blocks that fit within overlapTokens
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
  
  private createChunk(
    content: string,
    number: number,
    sectionPath: string[],
    section: Section,
    globalMetadata: GlobalMetadata,
    structure: DocumentStructure,
    options: ChunkingOptions
  ): Chunk {
    const tokens = countTokens(content);
    
    // Strip HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const preview = textContent.slice(0, 100) || "Empty content...";
    
    // Build title from section path or heading
    let title: string;
    if (sectionPath.length > 0) {
      title = `Chunk ${number}: ${sectionPath.join(" > ")}`;
    } else if (section.heading) {
      title = `Chunk ${number}: ${section.heading.text}`;
    } else {
      title = `Chunk ${number}: Section`;
    }
    
    // Extract page/slide from first block with metadata
    const firstBlock = section.heading || section.blocks[0];
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
        sectionPath,
        sourceFile: structure.sourceFile,
        page,
        slide,
      },
    };
  }
  
  private fallbackToParagraphChunking(
    structure: DocumentStructure,
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[] {
    // If no headings, use simple paragraph-based chunking
    // This is a simplified version - full paragraph-aware strategy will handle this better
    const maxTokens = options.maxTokens ?? 1000;
    const chunks: Chunk[] = [];
    let chunkNumber = 1;
    
    let currentChunkBlocks: DocumentBlock[] = [];
    let currentTokens = 0;
    
    for (const block of structure.blocks) {
      if (block.type === "heading" || block.type === "slideTitle") {
        continue; // Skip headings in fallback mode
      }
      
      const blockTokens = countTokens(block.html);
      
      if (currentTokens + blockTokens > maxTokens && currentChunkBlocks.length > 0) {
        const content = currentChunkBlocks.map(b => b.html).join("\n");
        chunks.push(this.createChunk(
          content,
          chunkNumber++,
          [],
          { heading: null, blocks: currentChunkBlocks, level: 0, sectionPath: [] },
          globalMetadata,
          structure,
          options
        ));
        currentChunkBlocks = [block];
        currentTokens = blockTokens;
      } else {
        currentChunkBlocks.push(block);
        currentTokens += blockTokens;
      }
    }
    
    if (currentChunkBlocks.length > 0) {
      const content = currentChunkBlocks.map(b => b.html).join("\n");
      chunks.push(this.createChunk(
        content,
        chunkNumber,
        [],
        { heading: null, blocks: currentChunkBlocks, level: 0, sectionPath: [] },
        globalMetadata,
        structure,
        options
      ));
    }
    
    return chunks;
  }
  
  validateOptions(options: ChunkingOptions): boolean {
    if (options.maxTokens !== undefined && (options.maxTokens < 1 || options.maxTokens > 10000)) {
      return false;
    }
    if (options.overlapTokens !== undefined && (options.overlapTokens < 0 || options.overlapTokens > 1000)) {
      return false;
    }
    if (options.subChunkingStrategy && !["paragraph", "sentence"].includes(options.subChunkingStrategy)) {
      return false;
    }
    return true;
  }
}


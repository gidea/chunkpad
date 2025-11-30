/**
 * Chunking strategy interface and types
 * 
 * This module defines the interface that all chunking strategies must implement,
 * allowing for extensible and pluggable chunking algorithms.
 */

import { Chunk, GlobalMetadata } from "@/types";
import { DocumentStructure } from "@/types/document";

/**
 * Options for chunking strategies
 */
export interface ChunkingOptions {
  maxTokens?: number;           // Maximum tokens per chunk
  overlapTokens?: number;       // Overlap between chunks (in tokens)
  minChunkTokens?: number;      // Minimum chunk size (optional)
  preserveStructure?: boolean;  // Whether to preserve HTML structure
  [key: string]: any;           // Strategy-specific options
}

/**
 * Interface that all chunking strategies must implement
 */
export interface ChunkingStrategy {
  /** Unique identifier for the strategy (e.g., "fixed-size") */
  id: string;
  
  /** Human-readable name for the strategy */
  name: string;
  
  /** User-facing description of the strategy */
  description: string;
  
  /** Default options for this strategy */
  defaultOptions: ChunkingOptions;
  
  /**
   * Chunk a document structure into an array of chunks
   * 
   * @param structure - The normalized document structure to chunk
   * @param options - Chunking options (will be merged with defaultOptions)
   * @param globalMetadata - Global metadata to apply to all chunks
   * @returns Array of chunks
   */
  chunk(
    structure: DocumentStructure, 
    options: ChunkingOptions,
    globalMetadata: GlobalMetadata
  ): Chunk[];
  
  /**
   * Optional validation function for options
   * 
   * @param options - Options to validate
   * @returns true if options are valid, false otherwise
   */
  validateOptions?(options: ChunkingOptions): boolean;
}


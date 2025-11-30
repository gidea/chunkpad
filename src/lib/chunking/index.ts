/**
 * Chunking module entry point
 * 
 * Exports all chunking-related functionality and initializes the strategy registry
 */

// Export types and interfaces
export type { ChunkingStrategy, ChunkingOptions } from "./strategy";
export type { DocumentBlock, DocumentBlockType, DocumentStructure } from "@/types/document";

// Export utilities
export { countTokens } from "./utils";

// Export registry functions
export { registerStrategy, getStrategy, getAllStrategies, hasStrategy } from "./registry";

// Export strategies
export { FixedSizeStrategy } from "./strategies/fixed-size";
export { HeadingAwareStrategy } from "./strategies/heading-aware";
export { ParagraphAwareStrategy } from "./strategies/paragraph-aware";
export { SlidingWindowStrategy } from "./strategies/sliding-window";

// Export legacy functions for backward compatibility
export { chunkDocument, rechunkDocument, formatChunkWithFrontMatter } from "../chunking";

// Initialize registry with all strategies
import { registerStrategy } from "./registry";
import { FixedSizeStrategy } from "./strategies/fixed-size";
import { HeadingAwareStrategy } from "./strategies/heading-aware";
import { ParagraphAwareStrategy } from "./strategies/paragraph-aware";
import { SlidingWindowStrategy } from "./strategies/sliding-window";

// Register all strategies
registerStrategy(new FixedSizeStrategy());
registerStrategy(new HeadingAwareStrategy());
registerStrategy(new ParagraphAwareStrategy());
registerStrategy(new SlidingWindowStrategy());


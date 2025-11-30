/**
 * Chunking strategy registry
 * 
 * Central registry for all available chunking strategies.
 * Strategies are registered here and can be retrieved by ID.
 */

import { ChunkingStrategy } from "./strategy";

const strategies: Map<string, ChunkingStrategy> = new Map();

/**
 * Register a chunking strategy
 * 
 * @param strategy - The strategy to register
 */
export function registerStrategy(strategy: ChunkingStrategy): void {
  strategies.set(strategy.id, strategy);
}

/**
 * Get a strategy by ID
 * 
 * @param id - Strategy ID
 * @returns The strategy if found, undefined otherwise
 */
export function getStrategy(id: string): ChunkingStrategy | undefined {
  return strategies.get(id);
}

/**
 * Get all registered strategies
 * 
 * @returns Array of all registered strategies
 */
export function getAllStrategies(): ChunkingStrategy[] {
  return Array.from(strategies.values());
}

/**
 * Check if a strategy is registered
 * 
 * @param id - Strategy ID
 * @returns true if strategy is registered, false otherwise
 */
export function hasStrategy(id: string): boolean {
  return strategies.has(id);
}


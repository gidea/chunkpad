/**
 * Shared utilities for chunking strategies
 */

import { encoding_for_model } from "tiktoken";

const encoder = encoding_for_model("gpt-3.5-turbo");

/**
 * Count tokens in text using tiktoken
 * 
 * @param text - Text to count tokens for
 * @returns Number of tokens
 */
export function countTokens(text: string): number {
  const tokens = encoder.encode(text);
  return tokens.length;
}


# Chunking Strategies Guide

This guide explains the different chunking strategies available in Chunkpad and when to use each one.

## Overview

Chunkpad offers multiple chunking strategies to help you convert documents into RAG-efficient materials. Each strategy has different strengths and is optimized for different types of content and use cases.

## Available Strategies

### 1. Fixed Size

**Best for:** General purpose chunking, unstructured documents, when consistent chunk size is important

**How it works:**
- Splits documents into chunks of a fixed token size
- Respects HTML block boundaries (won't split mid-paragraph)
- Applies overlap between chunks to maintain context
- Falls back to sentence-level splitting for oversized blocks

**Configuration:**
- **Max Tokens**: Maximum tokens per chunk (default: 1000)
- **Overlap Tokens**: Number of tokens to overlap between chunks (default: 150)

**Use when:**
- You need predictable, consistent chunk sizes
- Working with unstructured or poorly structured documents
- Chunk size consistency is more important than semantic boundaries
- You want a simple, reliable chunking method

**Example:**
A 5000-token document with max tokens of 1000 and overlap of 150 will create approximately 5-6 chunks, each around 1000 tokens, with 150 tokens of overlap between consecutive chunks.

---

### 2. Heading-Aware

**Best for:** Structured documents with clear headings (manuals, reports, technical documentation)

**How it works:**
- Groups content under headings, creating chunks that start at heading boundaries
- Preserves document hierarchy (H1 > H2 > H3, etc.)
- Includes section path in chunk metadata (e.g., `["Chapter 1", "Section 1.1", "Subsection 1.1.1"]`)
- For oversized sections, applies sub-chunking (paragraph or sentence level)

**Configuration:**
- **Max Tokens**: Maximum tokens per chunk (default: 1000)
- **Overlap Tokens**: Overlap between sub-chunks of large sections (default: 150)
- **Min Chunk Tokens**: Minimum tokens for standalone sections (default: 200)
- **Sub-chunking Strategy**: How to split oversized sections - "paragraph" or "sentence" (default: "paragraph")

**Use when:**
- Your document has clear heading hierarchy
- Section context is important for retrieval
- You want to preserve document structure
- You need hierarchical filtering in vector databases

**Example:**
A document with:
```
# Chapter 1: Introduction
## Section 1.1: Overview
Content here...
## Section 1.2: Goals
Content here...
```

Will create chunks that start at each heading, preserving the hierarchy. The chunk metadata will include `sectionPath: ["Chapter 1: Introduction", "Section 1.1: Overview"]`.

**Edge Cases:**
- Documents with no headings: Falls back to paragraph-aware chunking
- Very large sections: Automatically splits using the sub-chunking strategy
- Deep nesting (H6+): Handles all heading levels

---

### 3. Paragraph-Aware

**Best for:** Long-form narrative content, blog posts, articles, stories

**How it works:**
- Groups consecutive paragraphs together up to the max token limit
- Maintains paragraph coherence (never splits mid-paragraph)
- Recursive fallback: paragraph → sentence → token level
- Never splits mid-sentence

**Configuration:**
- **Max Tokens**: Maximum tokens per chunk (default: 1000)
- **Overlap Tokens**: Overlap between chunks (default: 150)
- **Min Paragraphs per Chunk**: Minimum number of paragraphs (default: 1)
- **Max Paragraphs per Chunk**: Maximum number of paragraphs (default: 10)
- **Preserve Paragraph Boundaries**: Always respect paragraph boundaries (default: true)

**Use when:**
- Working with narrative or prose content
- Paragraph boundaries are semantically meaningful
- You want to maintain paragraph coherence
- Documents don't have clear heading structure

**Example:**
A blog post with 20 paragraphs will be grouped into chunks of 1-10 paragraphs each, depending on their size. If a single paragraph is too large, it will be split by sentences, and if a sentence is too large, it will be split by tokens while preserving word boundaries.

**Fallback Behavior:**
1. **Paragraph level**: Try to group paragraphs
2. **Sentence level**: If paragraph too large, split by sentences
3. **Token level**: If sentence too large, split by tokens (preserving word boundaries)

---

### 4. Sliding Window

**Best for:** Technical specifications, code documentation, dense technical content

**How it works:**
- Creates overlapping chunks with configurable window size and overlap
- Ensures no information is lost between chunks
- Maximum context preservation
- Can preserve word or sentence boundaries

**Configuration:**
- **Window Size**: Size of each window in tokens (default: 1000)
- **Overlap Size**: Overlap between windows in tokens (default: 200)
- **Preserve Word Boundaries**: Don't split mid-word (default: true)
- **Preserve Sentence Boundaries**: Prefer sentence boundaries (default: false)

**Use when:**
- Context spanning boundaries is critical
- Working with technical or code-like content
- You need maximum context preservation
- You don't mind having many overlapping chunks

**Example:**
A 3000-token document with window size 1000 and overlap 200 will create chunks at positions:
- Chunk 1: tokens 0-1000
- Chunk 2: tokens 800-1800 (200 token overlap)
- Chunk 3: tokens 1600-2600 (200 token overlap)
- Chunk 4: tokens 2400-3000

**Trade-offs:**
- Creates more chunks than other strategies (larger index)
- May duplicate content across chunks
- Higher storage and compute costs
- But ensures no context is lost

---

## Choosing the Right Strategy

### Decision Tree

1. **Does your document have clear headings?**
   - **Yes** → Use **Heading-Aware**
   - **No** → Continue to step 2

2. **Is your content narrative/prose?**
   - **Yes** → Use **Paragraph-Aware**
   - **No** → Continue to step 3

3. **Is context spanning boundaries critical?**
   - **Yes** → Use **Sliding Window**
   - **No** → Use **Fixed Size**

### Quick Reference

| Document Type | Recommended Strategy | Why |
|--------------|---------------------|-----|
| Technical Manual | Heading-Aware | Preserves structure, section context |
| Research Paper | Heading-Aware | Clear sections, hierarchical structure |
| Blog Post | Paragraph-Aware | Narrative flow, paragraph coherence |
| Novel/Story | Paragraph-Aware | Maintains narrative structure |
| API Documentation | Sliding Window | Context across boundaries important |
| Code Comments | Sliding Window | Technical context preservation |
| Unstructured Text | Fixed Size | Simple, reliable, consistent |
| Mixed Content | Fixed Size | Works for everything |

## Configuration Tips

### Token Sizes

- **Small chunks (500-800 tokens)**: Better for precise retrieval, more chunks
- **Medium chunks (800-1200 tokens)**: Good balance (recommended)
- **Large chunks (1200-2000 tokens)**: More context, fewer chunks

### Overlap Sizes

- **Small overlap (50-100 tokens)**: Minimal duplication, less context preservation
- **Medium overlap (100-200 tokens)**: Good balance (recommended)
- **Large overlap (200-300 tokens)**: Maximum context, more duplication

### Strategy-Specific Tips

**Heading-Aware:**
- Use "paragraph" sub-chunking for most cases
- Use "sentence" sub-chunking if sections are very dense

**Paragraph-Aware:**
- Adjust min/max paragraphs based on average paragraph size
- Smaller paragraphs → higher max paragraphs
- Larger paragraphs → lower max paragraphs

**Sliding Window:**
- Enable "Preserve Sentence Boundaries" for better readability
- Larger overlap for technical content (200-300 tokens)
- Smaller overlap for narrative content (100-150 tokens)

## Per-File Configuration

Each file in your project can have its own chunking strategy and configuration. This allows you to:
- Use different strategies for different document types
- Optimize chunking for each document's structure
- Experiment with different settings without affecting other files

To change a file's chunking strategy:
1. Select the file
2. Open Settings
3. Choose a strategy
4. Configure options
5. The document will be automatically re-chunked

## Export Format

All chunks include metadata about their chunking strategy:

- **strategy**: The strategy ID used (e.g., "heading-aware")
- **strategyOptions**: The options used for chunking
- **sectionPath**: Array of headings (for heading-aware strategy)
- **sourceFile**: Source file name
- **page**: Page number (for PDFs)
- **slide**: Slide number (for PPTX)

This metadata is included in:
- JSON exports (as part of chunk object)
- Markdown exports (in YAML front matter)
- Plain text exports (in header comments)

## Best Practices

1. **Start with Fixed Size** for general use, then optimize based on results
2. **Use Heading-Aware** for structured documents - it usually provides better semantic coherence
3. **Test different strategies** on a sample of your documents before processing everything
4. **Monitor chunk sizes** - very small or very large chunks may indicate the wrong strategy
5. **Check section paths** in heading-aware chunks to ensure hierarchy is preserved correctly
6. **Use appropriate overlap** - too little loses context, too much wastes storage

## Troubleshooting

**Problem**: Chunks are too small
- **Solution**: Increase max tokens or switch to a strategy that groups more content

**Problem**: Chunks are too large
- **Solution**: Decrease max tokens or enable sub-chunking for heading-aware

**Problem**: Important context is split across chunks
- **Solution**: Increase overlap size or use sliding window strategy

**Problem**: Heading hierarchy is lost
- **Solution**: Use heading-aware strategy and check that your document has proper headings

**Problem**: Paragraphs are split mid-sentence
- **Solution**: Use paragraph-aware strategy with preserve paragraph boundaries enabled

## Future Enhancements

Future versions may include:
- Semantic/embedding-aware chunking (uses AI to find topic boundaries)
- Custom strategy builder
- Strategy recommendations based on document analysis
- Batch strategy testing and comparison


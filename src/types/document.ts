/**
 * Document structure types for normalized representation of parsed documents
 * across all document types (PDF, DOCX, PPTX)
 */

export type DocumentBlockType = 
  | "heading"      // h1-h6 elements
  | "paragraph"    // p elements
  | "listItem"     // li elements (with nesting level)
  | "table"        // table elements
  | "code"         // code/pre elements
  | "slideTitle"   // h2 in pptx slides
  | "slideNote"    // Speaker notes (future)
  | "pageBreak"    // Page boundaries
  | "other";       // Unknown/unsupported elements

export interface DocumentBlock {
  type: DocumentBlockType;
  level?: number;  // For headings: 1-6, for list items: nesting level
  text: string;    // Plain text content (for token counting, search)
  html: string;    // Original HTML representation (for export)
  metadata?: {
    source?: "pdf" | "docx" | "pptx";
    page?: number;      // Page number (PDF)
    slide?: number;     // Slide number (PPTX)
    [key: string]: any; // Extensible for future metadata
  };
}

export interface DocumentStructure {
  blocks: DocumentBlock[];
  sourceFile: string;
  sourceType: "pdf" | "docx" | "pptx";
}


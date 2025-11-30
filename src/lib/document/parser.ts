/**
 * HTML to DocumentBlock converter
 * 
 * Converts HTML output from document parsers into normalized DocumentStructure
 * that can be consumed by chunking strategies.
 */

import { DocumentBlock, DocumentBlockType, DocumentStructure } from "@/types/document";

/**
 * Convert HTML string to DocumentStructure
 * 
 * @param html - HTML string from document parser
 * @param sourceType - Type of source document (pdf, docx, pptx)
 * @param sourceFile - Name/path of source file
 * @returns DocumentStructure with normalized blocks
 */
export function htmlToDocumentBlocks(
  html: string,
  sourceType: "pdf" | "docx" | "pptx",
  sourceFile: string
): DocumentStructure {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const blocks: DocumentBlock[] = [];
  let currentPage: number | undefined;
  let currentSlide: number | undefined;
  
  // Helper to extract text content from element
  const getTextContent = (element: Element): string => {
    return element.textContent?.trim() || '';
  };
  
  // Helper to extract plain text (for token counting)
  const getPlainText = (element: Element): string => {
    // Clone to avoid modifying original
    const clone = element.cloneNode(true) as Element;
    // Remove script and style elements
    const scripts = clone.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    return clone.textContent?.trim() || '';
  };
  
  // Process all elements in document order
  const processElement = (element: Element): void => {
    const tagName = element.tagName.toLowerCase();
    
    // Handle page/slide containers
    if (tagName === 'div' && element.hasAttribute('data-source')) {
      const source = element.getAttribute('data-source');
      const pageAttr = element.getAttribute('data-page');
      
      if (source === 'pdf' && pageAttr) {
        currentPage = parseInt(pageAttr, 10);
      } else if (source === 'pptx' && pageAttr) {
        currentSlide = parseInt(pageAttr, 10);
      }
      
      // Process children recursively
      Array.from(element.children).forEach(child => processElement(child));
      return;
    }
    
    // Handle headings (h1-h6)
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName.charAt(1), 10);
      const text = getTextContent(element);
      const html = element.outerHTML;
      
      if (text) {
        blocks.push({
          type: sourceType === 'pptx' ? 'slideTitle' : 'heading',
          level,
          text,
          html,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      }
      return;
    }
    
    // Handle paragraphs
    if (tagName === 'p') {
      const text = getPlainText(element);
      const html = element.outerHTML;
      
      if (text) {
        blocks.push({
          type: 'paragraph',
          text,
          html,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      }
      return;
    }
    
    // Handle list items
    if (tagName === 'li') {
      const text = getPlainText(element);
      const html = element.outerHTML;
      
      // Determine nesting level by counting parent ul/ol elements
      let level = 1;
      let parent = element.parentElement;
      while (parent) {
        if (parent.tagName.toLowerCase() === 'ul' || parent.tagName.toLowerCase() === 'ol') {
          const grandParent = parent.parentElement;
          if (grandParent && (grandParent.tagName.toLowerCase() === 'ul' || grandParent.tagName.toLowerCase() === 'ol')) {
            level++;
            parent = grandParent;
          } else {
            break;
          }
        } else {
          parent = parent.parentElement;
        }
      }
      
      if (text) {
        blocks.push({
          type: 'listItem',
          level,
          text,
          html,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      }
      return;
    }
    
    // Handle tables
    if (tagName === 'table') {
      const text = getPlainText(element);
      const html = element.outerHTML;
      
      if (text) {
        blocks.push({
          type: 'table',
          text,
          html,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      }
      return;
    }
    
    // Handle code blocks
    if (tagName === 'code' || tagName === 'pre') {
      const text = getTextContent(element);
      const html = element.outerHTML;
      
      if (text) {
        blocks.push({
          type: 'code',
          text,
          html,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      }
      return;
    }
    
    // Handle other block-level elements (div, section, blockquote, etc.)
    if (['div', 'section', 'blockquote', 'article', 'aside'].includes(tagName)) {
      // Only process if it has direct text content (not just containers)
      const text = getPlainText(element);
      if (text && element.children.length === 0) {
        blocks.push({
          type: 'other',
          text,
          html: element.outerHTML,
          metadata: {
            source: sourceType,
            page: currentPage,
            slide: currentSlide,
          },
        });
      } else {
        // Process children recursively
        Array.from(element.children).forEach(child => processElement(child));
      }
      return;
    }
    
    // For other elements, process children if any
    if (element.children.length > 0) {
      Array.from(element.children).forEach(child => processElement(child));
    }
  };
  
  // Start processing from body or document root
  const body = doc.body || doc.documentElement;
  if (body) {
    Array.from(body.children).forEach(child => processElement(child));
  }
  
  return {
    blocks,
    sourceFile,
    sourceType,
  };
}


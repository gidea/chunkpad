import * as pdfjsLib from "pdfjs-dist";

// Configure the worker - use a more reliable CDN path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function parsePdf(arrayBuffer: ArrayBuffer): Promise<string> {
  let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>> | null = null;
  try {
    const typedArray = new Uint8Array(arrayBuffer);
    pdf = await pdfjsLib.getDocument(typedArray).promise;
    
    const htmlPages: string[] = [];
    
    // Extract text from each page with paragraph detection
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items into paragraphs based on vertical positioning
      const items = textContent.items as any[];
      const paragraphs: string[] = [];
      let currentParagraph: string[] = [];
      let lastY = 0;
      
      items.forEach((item, index) => {
        const str = item.str?.trim();
        if (!str) return;
        
        // Get vertical position (Y coordinate)
        const currentY = item.transform[5];
        
        // Detect paragraph break based on Y-coordinate change
        // If Y position changes significantly (more than font size), start new paragraph
        const yDiff = Math.abs(currentY - lastY);
        const fontSize = item.transform[0] || 12;
        
        if (index > 0 && yDiff > fontSize * 1.5) {
          // Save current paragraph and start new one
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(" "));
            currentParagraph = [];
          }
        }
        
        currentParagraph.push(str);
        lastY = currentY;
      });
      
      // Add the last paragraph
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "));
      }
      
      // Create HTML with proper paragraph tags
      if (paragraphs.length > 0) {
        const paragraphsHtml = paragraphs
          .filter(p => p.trim())
          .map(p => `  <p>${p}</p>`)
          .join("\n");
        
        htmlPages.push(`<div data-source="pdf" data-page="${pageNum}">
  <h2>Page ${pageNum}</h2>
${paragraphsHtml}
</div>`);
      }
    }
    
    if (htmlPages.length === 0) {
      throw new Error("No text content found in PDF");
    }
    
    return htmlPages.join('\n\n');
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse .pdf file");
  } finally {
    // Clean up PDF document to free memory
    if (pdf) {
      try {
        pdf.destroy();
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn("Error cleaning up PDF document:", cleanupError);
      }
    }
  }
}

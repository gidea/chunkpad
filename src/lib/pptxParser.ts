import JSZip from "jszip";

interface SlideContent {
  title: string;
  paragraphs: string[];
}

function extractSlideContent(xmlDoc: Document): SlideContent {
  const aNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
  const pNamespace = "http://schemas.openxmlformats.org/presentationml/2006/main";
  
  let title = '';
  const paragraphs: string[] = [];
  
  // Try to extract title from title placeholder
  const titleShapes = xmlDoc.getElementsByTagNameNS(pNamespace, "sp");
  for (let i = 0; i < titleShapes.length; i++) {
    const shape = titleShapes[i];
    const nvSpPr = shape.getElementsByTagNameNS(pNamespace, "nvSpPr")[0];
    if (nvSpPr) {
      const phType = nvSpPr.getElementsByTagNameNS(pNamespace, "ph")[0];
      if (phType && phType.getAttribute("type") === "title") {
        const textNodes = shape.getElementsByTagNameNS(aNamespace, "t");
        const titleParts: string[] = [];
        for (let j = 0; j < textNodes.length; j++) {
          const content = textNodes[j].textContent?.trim();
          if (content) titleParts.push(content);
        }
        title = titleParts.join(" ");
        break;
      }
    }
  }
  
  // Extract all text content organized by paragraphs
  const aParagraphs = xmlDoc.getElementsByTagNameNS(aNamespace, "p");
  for (let i = 0; i < aParagraphs.length; i++) {
    const para = aParagraphs[i];
    const textNodes = para.getElementsByTagNameNS(aNamespace, "t");
    const paraText: string[] = [];
    
    for (let j = 0; j < textNodes.length; j++) {
      const content = textNodes[j].textContent?.trim();
      if (content) {
        paraText.push(content);
      }
    }
    
    const fullPara = paraText.join(" ").trim();
    if (fullPara && fullPara !== title) {
      paragraphs.push(fullPara);
    }
  }
  
  return { title, paragraphs };
}

export async function parsePptx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    const htmlSlides: string[] = [];
    
    let slideIndex = 1;
    while (true) {
      const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);
      
      if (!slideFile) break;
      
      const slideXmlStr = await slideFile.async('text');
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXmlStr, 'application/xml');
      
      const { title, paragraphs } = extractSlideContent(xmlDoc);
      
      if (title || paragraphs.length > 0) {
        const slideTitle = title || `Slide ${slideIndex}`;
        const paragraphsHtml = paragraphs.length > 0
          ? paragraphs.map(p => `  <p>${p}</p>`).join("\n")
          : '  <p></p>';
        
        htmlSlides.push(`<div data-source="pptx" data-page="${slideIndex}">
  <h2>${slideTitle}</h2>
${paragraphsHtml}
</div>`);
      }
      
      slideIndex++;
    }

    if (htmlSlides.length === 0) {
      throw new Error("No slides found in PPTX file");
    }
    
    return htmlSlides.join('\n\n');
  } catch (error) {
    console.error("Error parsing pptx:", error);
    throw new Error("Failed to parse .pptx file");
  }
}

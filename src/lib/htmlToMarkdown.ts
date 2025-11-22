import TurndownService from "turndown";

// Configure Turndown for optimal markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// Add custom rules for better conversion
turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: (content) => `~~${content}~~`,
});

/**
 * Converts HTML to clean, properly formatted Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // Convert HTML to markdown
    let markdown = turndownService.turndown(html);

    // Clean up excessive whitespace
    markdown = markdown
      .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
      .replace(/[ \t]+$/gm, "") // Remove trailing spaces
      .trim();

    return markdown;
  } catch (error) {
    console.error("Error converting HTML to markdown:", error);
    return stripHtmlTags(html);
  }
}

/**
 * Strips HTML tags for plain text conversion
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  try {
    // Create a temporary DOM element to parse HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Get text content and clean up whitespace
    let text = temp.textContent || temp.innerText || "";

    // Clean up excessive whitespace
    text = text
      .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
      .replace(/[ \t]+/g, " ") // Collapse spaces
      .replace(/^[ \t]+/gm, "") // Remove leading spaces from lines
      .trim();

    return text;
  } catch (error) {
    console.error("Error stripping HTML tags:", error);
    // Fallback: simple regex-based stripping
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

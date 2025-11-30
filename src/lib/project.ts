import { ProjectData, DocFile, ChunksMap, GlobalMetadata } from "@/types";

const PROJECT_VERSION = "1.0.0";

/**
 * Serialize project data to JSON format
 */
export function serializeProject(
  files: DocFile[],
  chunksData: ChunksMap,
  globalMetadata: GlobalMetadata,
  chunkSize: number,
  overlapSize: number,
  fileChunkingConfig?: Record<string, { strategy: string; options: Record<string, any> }>
): ProjectData {
  return {
    version: PROJECT_VERSION,
    files,
    chunksData,
    globalMetadata,
    chunkSize,
    overlapSize,
    fileChunkingConfig,
    lastSaved: new Date().toISOString(),
  };
}

/**
 * Validate project data structure
 */
export function validateProject(data: unknown): data is ProjectData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const project = data as Partial<ProjectData>;

  // Check required fields
  if (
    !project.version ||
    !Array.isArray(project.files) ||
    !project.chunksData ||
    typeof project.chunksData !== "object" ||
    !project.globalMetadata ||
    typeof project.globalMetadata !== "object" ||
    typeof project.chunkSize !== "number" ||
    typeof project.overlapSize !== "number"
  ) {
    return false;
  }

  // Validate files structure
  for (const file of project.files) {
    if (
      !file.id ||
      !file.name ||
      !["docx", "pptx", "pdf"].includes(file.type)
    ) {
      return false;
    }
  }

  // Validate chunksData structure
  for (const [fileId, chunks] of Object.entries(project.chunksData)) {
    if (!Array.isArray(chunks)) {
      return false;
    }
    for (const chunk of chunks) {
      if (
        !chunk.id ||
        !chunk.title ||
        typeof chunk.content !== "string"
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Parse project data from JSON string
 */
export function parseProject(jsonString: string): ProjectData | null {
  try {
    const data = JSON.parse(jsonString);
    if (validateProject(data)) {
      return data as ProjectData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing project:", error);
    return null;
  }
}

/**
 * Get project file extension
 */
export function getProjectExtension(): string {
  return "chunkpad";
}

/**
 * Get project file filter for dialogs
 */
export function getProjectFileFilter() {
  return {
    name: "Chunkpad Project",
    extensions: [getProjectExtension()],
  };
}


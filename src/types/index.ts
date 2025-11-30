export interface DocFile {
  id: string;
  name: string;
  type: "docx" | "pptx" | "pdf";
  filePath?: string; // File path for Electron (optional for web compatibility)
}

export interface ChunkMetadata {
  topic?: string;
  category?: string;
  "domain-area"?: string;
  [key: string]: string | undefined;
}

export interface GlobalMetadata {
  [key: string]: string;
}

export interface Chunk {
  id: string;
  title: string;
  preview: string;
  content: string;
  tokens?: number;
  metadata?: ChunkMetadata & {
    strategy?: string; // Strategy ID used to create this chunk
    strategyOptions?: Record<string, any>; // Options used for chunking
    sectionPath?: string[]; // Array of headings: ["Chapter 1", "Section 1.1", "Subsection"]
    sourceFile?: string; // Source file name/path
    page?: number; // Page number (PDF)
    slide?: number; // Slide number (PPTX)
  };
}

export type ChunksMap = Record<string, Chunk[]>;

export interface ProjectData {
  version: string;
  files: DocFile[];
  chunksData: ChunksMap;
  globalMetadata: GlobalMetadata;
  chunkSize: number; // Deprecated: use fileChunkingConfig
  overlapSize: number; // Deprecated: use fileChunkingConfig
  fileChunkingConfig?: Record<string, { // Per-file chunking configuration
    strategy: string;
    options: Record<string, any>;
  }>;
  lastSaved: string;
}

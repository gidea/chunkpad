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
  metadata?: ChunkMetadata;
}

export type ChunksMap = Record<string, Chunk[]>;

export interface ProjectData {
  version: string;
  files: DocFile[];
  chunksData: ChunksMap;
  globalMetadata: GlobalMetadata;
  chunkSize: number;
  overlapSize: number;
  lastSaved: string;
}

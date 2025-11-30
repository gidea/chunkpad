import { useState, useEffect, useRef, useCallback } from "react";
import { FileList } from "@/components/FileList";
import { ChunkList } from "@/components/ChunkList";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { FileUploader } from "@/components/FileUploader";
import { DocumentMetadataDialog } from "@/components/DocumentMetadataDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ChunkingToolbar } from "@/components/ChunkingToolbar";
import { ExportDialog, ExportDialogRef } from "@/components/ExportDialog";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { parseDocx } from "@/lib/docxParser";
import { parsePptx } from "@/lib/pptxParser";
import { parsePdf } from "@/lib/pdfParser";
import { chunkDocument, rechunkDocument, countTokens } from "@/lib/chunking";
import { htmlToDocumentBlocks } from "@/lib/document/parser";
import { getStrategy } from "@/lib/chunking/registry";
import { ChunkingOptions } from "@/lib/chunking/strategy";
// Initialize chunking strategies
import "@/lib/chunking/index";
import { parseFrontMatter } from "@/lib/frontMatter";
import { ChunksMap, DocFile, GlobalMetadata, ChunkMetadata, Chunk, ProjectData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { serializeProject, parseProject, getProjectFileFilter } from "@/lib/project";

const Index = () => {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [chunksData, setChunksData] = useState<ChunksMap>({});
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlapSize, setOverlapSize] = useState(150);
  const [globalMetadata, setGlobalMetadata] = useState<GlobalMetadata>({});
  const [fileChunkingConfig, setFileChunkingConfig] = useState<Record<string, { strategy: string; options: ChunkingOptions }>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editingFileName, setEditingFileName] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [projectPath, setProjectPath] = useState<string | null>(null); // Track current project path
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
  const { toast } = useToast();
  const exportDialogRef = useRef<ExportDialogRef>(null);

  // Get current chunks for selected file
  const currentChunks = selectedFileId ? chunksData[selectedFileId] || [] : [];

  // Get current chunk
  const currentChunk = currentChunks.find((c) => c.id === selectedChunkId) || null;

  // File loading handler - defined first so it can be used by other handlers
  const handleFileLoad = useCallback(async (fileName: string, arrayBuffer: ArrayBuffer, filePath?: string) => {
    // Check file size and warn if too large
    const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
    if (fileSizeMB > 50) {
      toast({
        title: "Large file detected",
        description: `File size is ${fileSizeMB.toFixed(1)}MB. Processing may take a while...`,
        variant: "default",
      });
    }

    setIsLoading(true);
    setLoadingMessage(`Processing ${fileName}...`);
    setLoadingProgress(undefined);

    try {
      let text: string;
      let fileType: "docx" | "pptx" | "pdf";

      setLoadingMessage(`Parsing ${fileName}...`);
      setLoadingProgress(20);

      if (fileName.endsWith(".pdf")) {
        text = await parsePdf(arrayBuffer);
        fileType = "pdf";
      } else if (fileName.endsWith(".pptx")) {
        text = await parsePptx(arrayBuffer);
        fileType = "pptx";
      } else {
        text = await parseDocx(arrayBuffer);
        fileType = "docx";
      }

      setLoadingMessage("Chunking document...");
      setLoadingProgress(60);

      // Convert HTML to DocumentStructure
      const structure = htmlToDocumentBlocks(text, fileType, fileName);
      
      // Get chunking strategy for this file (or use default)
      const fileId = `file-${Date.now()}`;
      const fileConfig = fileChunkingConfig[fileId] || {
        strategy: "fixed-size",
        options: { maxTokens: chunkSize, overlapTokens: overlapSize },
      };
      
      const strategy = getStrategy(fileConfig.strategy);
      if (!strategy) {
        throw new Error(`Strategy "${fileConfig.strategy}" not found`);
      }
      
      const chunks = strategy.chunk(structure, fileConfig.options, globalMetadata);

      setLoadingProgress(90);

      const newFile: DocFile = {
        id: fileId,
        name: fileName,
        type: fileType,
        filePath: filePath,
      };

      setFiles((prevFiles) => [...prevFiles, newFile]);
      setChunksData((prevChunks) => ({
        ...prevChunks,
        [newFile.id]: chunks,
      }));
      
      // Store chunking config for this file
      setFileChunkingConfig((prev) => ({
        ...prev,
        [fileId]: fileConfig,
      }));
      setSelectedFileId(newFile.id);
      setSelectedChunkId(chunks[0]?.id || null);

      setLoadingProgress(100);
      setIsLoading(false);

      toast({
        title: "Document processed",
        description: `Created ${chunks.length} chunks from ${fileName}`,
      });
    } catch (error) {
      setIsLoading(false);
      setLoadingProgress(undefined);
      console.error("Error processing file:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Could not process the document",
        variant: "destructive",
      });
    }
  }, [chunkSize, overlapSize, globalMetadata, fileChunkingConfig, toast]);

  // Handle file open from menu or button
  const handleOpenFile = useCallback(async () => {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    if (!isElectron || !window.electronAPI) {
      // Fallback to web file input
      document.getElementById('file-upload')?.click();
      return;
    }

    try {
      const result = await window.electronAPI.openFile();
      if (!result) {
        // User cancelled
        return;
      }

      const { filePath, data } = result;
      const fileName = filePath.split(/[/\\]/).pop() || 'Unknown';

      // Validate file extension
      const validExtensions = [".docx", ".pptx", ".pdf"];
      const isValid = validExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

      if (!isValid) {
        toast({
          title: "Invalid file type",
          description: "Please select a .docx, .pptx, or .pdf file",
          variant: "destructive",
        });
        return;
      }

      await handleFileLoad(fileName, data, filePath);
    } catch (error) {
      console.error('Error opening file:', error);
      toast({
        title: "Error loading file",
        description: "Failed to read the file",
        variant: "destructive",
      });
    }
  }, [handleFileLoad, toast]);

  // Save Project
  const handleSaveProject = useCallback(async () => {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    if (!isElectron || !window.electronAPI) {
      toast({
        title: "Not available",
        description: "Project save is only available in the desktop app",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Saving project...");
    setLoadingProgress(undefined);

    try {
      const projectData = serializeProject(
        files,
        chunksData,
        globalMetadata,
        chunkSize,
        overlapSize,
        fileChunkingConfig
      );

      let filePath: string | null;

      if (projectPath) {
        // Save to existing project path
        await window.electronAPI.saveFileContent(projectPath, JSON.stringify(projectData, null, 2));
        filePath = projectPath;
      } else {
        // Show save dialog for new project
        filePath = await window.electronAPI.saveProject(projectData);
      }

      if (filePath) {
        setProjectPath(filePath);
        setIsLoading(false);
        toast({
          title: "Project saved",
          description: `Project saved successfully`,
        });
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error saving project:', error);
      toast({
        title: "Error saving project",
        description: "Failed to save the project",
        variant: "destructive",
      });
    }
  }, [files, chunksData, globalMetadata, chunkSize, overlapSize, projectPath, toast]);

  // Save Project As
  const handleSaveProjectAs = useCallback(async () => {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    if (!isElectron || !window.electronAPI) {
      toast({
        title: "Not available",
        description: "Project save is only available in the desktop app",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Saving project...");
    setLoadingProgress(undefined);

    try {
      const projectData = serializeProject(
        files,
        chunksData,
        globalMetadata,
        chunkSize,
        overlapSize,
        fileChunkingConfig
      );

      const filePath = await window.electronAPI.saveProject(projectData);

      if (filePath) {
        setProjectPath(filePath);
        setIsLoading(false);
        toast({
          title: "Project saved",
          description: `Project saved to ${filePath.split(/[/\\]/).pop()}`,
        });
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error saving project:', error);
      toast({
        title: "Error saving project",
        description: "Failed to save the project",
        variant: "destructive",
      });
    }
  }, [files, chunksData, globalMetadata, chunkSize, overlapSize, toast]);

  // Shared function to restore project state
  const restoreProjectState = useCallback((projectData: ReturnType<typeof parseProject>, filePath: string) => {
    if (!projectData) {
      return false;
    }

    // Restore project state
    setFiles(projectData.files);
    setChunksData(projectData.chunksData);
    setGlobalMetadata(projectData.globalMetadata);
    setChunkSize(projectData.chunkSize);
    setOverlapSize(projectData.overlapSize);
    setProjectPath(filePath);
    
    // Restore file chunking config or migrate from old format
    if (projectData.fileChunkingConfig) {
      setFileChunkingConfig(projectData.fileChunkingConfig);
    } else {
      // Migrate old format to new format
      const migratedConfig: Record<string, { strategy: string; options: ChunkingOptions }> = {};
      projectData.files.forEach(file => {
        migratedConfig[file.id] = {
          strategy: "fixed-size",
          options: {
            maxTokens: projectData.chunkSize,
            overlapTokens: projectData.overlapSize,
          },
        };
      });
      setFileChunkingConfig(migratedConfig);
    }

    // Select first file and chunk if available
    if (projectData.files.length > 0) {
      setSelectedFileId(projectData.files[0].id);
      const firstFileChunks = projectData.chunksData[projectData.files[0].id] || [];
      if (firstFileChunks.length > 0) {
        setSelectedChunkId(firstFileChunks[0].id);
      } else {
        setSelectedChunkId(null);
      }
    } else {
      setSelectedFileId(null);
      setSelectedChunkId(null);
    }

    return true;
  }, []);

  // Load Project
  const handleLoadProject = useCallback(async () => {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    if (!isElectron || !window.electronAPI) {
      toast({
        title: "Not available",
        description: "Project load is only available in the desktop app",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Loading project...");
    setLoadingProgress(undefined);

    try {
      const result = await window.electronAPI.loadProject();
      if (!result) {
        // User cancelled
        setIsLoading(false);
        return;
      }

      const { filePath, data } = result;
      const projectData = parseProject(typeof data === 'string' ? data : JSON.stringify(data));

      if (!projectData) {
        setIsLoading(false);
        toast({
          title: "Invalid project file",
          description: "The selected file is not a valid Chunkpad project",
          variant: "destructive",
        });
        return;
      }

      restoreProjectState(projectData, filePath);

      setIsLoading(false);
      toast({
        title: "Project loaded",
        description: `Project loaded successfully`,
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Error loading project:', error);
      toast({
        title: "Error loading project",
        description: "Failed to load the project",
        variant: "destructive",
      });
    }
  }, [toast, restoreProjectState]);

  // Listen for Electron menu events
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;
    if (!isElectron || !window.electronAPI) return;

    // Menu: Open File
    const removeOpenFileListener = window.electronAPI.onMenuOpenFile(() => {
      handleOpenFile();
    });

    // Menu: Export
    const removeExportListener = window.electronAPI.onMenuExport(() => {
      exportDialogRef.current?.trigger();
    });

    // Menu: Toggle Sidebar
    const removeToggleSidebarListener = window.electronAPI.onMenuToggleSidebar(() => {
      setSidebarCollapsed((prev) => !prev);
    });

    // Menu: Show Shortcuts
    const removeShowShortcutsListener = window.electronAPI.onMenuShowShortcuts(() => {
      setShowShortcuts(true);
    });

    // Menu: Save Project
    const removeSaveProjectListener = window.electronAPI.onMenuSaveProject(() => {
      handleSaveProject();
    });

    // Menu: Save Project As
    const removeSaveProjectAsListener = window.electronAPI.onMenuSaveProjectAs(() => {
      handleSaveProjectAs();
    });

    // Menu: Load Project
    const removeLoadProjectListener = window.electronAPI.onMenuLoadProject(() => {
      handleLoadProject();
    });

    // File opening from command line or "Open With"
    const removeFileOpenDocumentListener = window.electronAPI.onFileOpenDocument(async (data) => {
      const { filePath, data: arrayBuffer } = data;
      const fileName = filePath.split(/[/\\]/).pop() || 'Unknown';
      await handleFileLoad(fileName, arrayBuffer, filePath);
    });

    const removeFileOpenProjectListener = window.electronAPI.onFileOpenProject(async (data) => {
      const { filePath, data: projectData } = data;
      const parsed = parseProject(typeof projectData === 'string' ? projectData : JSON.stringify(projectData));
      
      if (!parsed) {
        toast({
          title: "Invalid project file",
          description: "The selected file is not a valid Chunkpad project",
          variant: "destructive",
        });
        return;
      }

      restoreProjectState(parsed, filePath);

      toast({
        title: "Project loaded",
        description: `Project loaded successfully`,
      });
    });

    return () => {
      removeOpenFileListener();
      removeExportListener();
      removeToggleSidebarListener();
      removeShowShortcutsListener();
      removeSaveProjectListener();
      removeSaveProjectAsListener();
      removeLoadProjectListener();
      removeFileOpenDocumentListener();
      removeFileOpenProjectListener();
    };
  }, [handleOpenFile, handleSaveProject, handleSaveProjectAs, handleLoadProject, handleFileLoad, restoreProjectState, toast]);

  // Global keyboard shortcut: Cmd/Ctrl+? to show shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    const fileChunks = chunksData[fileId] || [];
    // Auto-select first chunk if available
    if (fileChunks.length > 0) {
      setSelectedChunkId(fileChunks[0].id);
    } else {
      setSelectedChunkId(null);
    }
  };

  const handleSelectChunk = (chunkId: string) => {
    setSelectedChunkId(chunkId);
  };

  const handleAddChunk = () => {
    let targetFileId = selectedFileId;

    // Create a new document if none exists
    if (!targetFileId) {
      const newFile: DocFile = {
        id: `file-${Date.now()}`,
        name: "New Document",
        type: "docx",
      };
      setFiles([...files, newFile]);
      targetFileId = newFile.id;
      setSelectedFileId(newFile.id);
      setChunksData({
        ...chunksData,
        [newFile.id]: [],
      });
    }

    const fileChunks = chunksData[targetFileId] || [];
    const newChunkNumber = fileChunks.length + 1;
    const content = "# New Section\n\nYour markdown content goes here...";
    const newChunk = {
      id: `chunk-${targetFileId}-${Date.now()}`,
      title: `Chunk ${newChunkNumber}: New section`,
      preview: "Start writing your content here...",
      content,
      tokens: countTokens(content),
      metadata: {},
    };

    setChunksData({
      ...chunksData,
      [targetFileId]: [...fileChunks, newChunk],
    });

    // Auto-select the new chunk
    setSelectedChunkId(newChunk.id);
  };

  const handleContentChange = (content: string) => {
    if (!selectedFileId || !selectedChunkId) return;

    // Parse front matter from the edited content
    const { metadata, content: contentWithoutFrontMatter } = parseFrontMatter(content);

    const fileChunks = chunksData[selectedFileId] || [];
    const updatedChunks = fileChunks.map((chunk) =>
      chunk.id === selectedChunkId
        ? {
            ...chunk,
            content: contentWithoutFrontMatter,
            metadata,
            tokens: countTokens(content),
            preview:
              contentWithoutFrontMatter
                .replace(/<[^>]*>/g, "")
                .split("\n")
                .find((line) => line.trim() !== "" && !line.startsWith("#"))
                ?.slice(0, 100) || "Empty content...",
          }
        : chunk,
    );

    setChunksData({
      ...chunksData,
      [selectedFileId]: updatedChunks,
    });
  };

  const handleChunkSizeChange = async (newSize: number) => {
    setChunkSize(newSize);
    if (selectedFileId && chunksData[selectedFileId]) {
      // Update file config
      const fileConfig = fileChunkingConfig[selectedFileId] || {
        strategy: "fixed-size",
        options: { maxTokens: chunkSize, overlapTokens: overlapSize },
      };
      
      const updatedOptions = {
        ...fileConfig.options,
        maxTokens: newSize,
      };
      
      setFileChunkingConfig((prev) => ({
        ...prev,
        [selectedFileId]: { ...fileConfig, options: updatedOptions },
      }));
      
      await rechunkWithStrategy(selectedFileId, fileConfig.strategy, updatedOptions);
    }
  };
  
  const rechunkWithStrategy = async (fileId: string, strategyId: string, options: ChunkingOptions) => {
    if (!chunksData[fileId]) return;
    
    setIsLoading(true);
    setLoadingMessage("Re-chunking document...");
    setLoadingProgress(undefined);

    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      setLoadingProgress(50);
      
      // Reconstruct document from chunks
      const fullContent = chunksData[fileId].map(c => c.content).join("\n");
      
      // Get file type from file
      const file = files.find(f => f.id === fileId);
      if (!file) return;
      
      // Convert back to DocumentStructure
      const structure = htmlToDocumentBlocks(fullContent, file.type, file.name);
      
      // Get strategy and re-chunk
      const strategy = getStrategy(strategyId);
      if (!strategy) {
        throw new Error(`Strategy "${strategyId}" not found`);
      }
      
      const rechunked = strategy.chunk(structure, options, globalMetadata);
      
      setChunksData({
        ...chunksData,
        [fileId]: rechunked,
      });
      setSelectedChunkId(rechunked[0]?.id || null);
      
      setIsLoading(false);
      toast({
        title: "Document re-chunked",
        description: `Document re-chunked with ${strategy.name} strategy`,
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Error re-chunking:', error);
      toast({
        title: "Re-chunking failed",
        description: "Could not re-chunk the document",
        variant: "destructive",
      });
    }
  };

  const handleOverlapSizeChange = async (newSize: number) => {
    setOverlapSize(newSize);
    if (selectedFileId && chunksData[selectedFileId]) {
      // Update file config
      const fileConfig = fileChunkingConfig[selectedFileId] || {
        strategy: "fixed-size",
        options: { maxTokens: chunkSize, overlapTokens: overlapSize },
      };
      
      const updatedOptions = {
        ...fileConfig.options,
        overlapTokens: newSize,
      };
      
      setFileChunkingConfig((prev) => ({
        ...prev,
        [selectedFileId]: { ...fileConfig, options: updatedOptions },
      }));
      
      await rechunkWithStrategy(selectedFileId, fileConfig.strategy, updatedOptions);
    }
  };
  
  const handleStrategyChange = async (strategyId: string, options: ChunkingOptions) => {
    if (!selectedFileId) return;
    
    setFileChunkingConfig((prev) => ({
      ...prev,
      [selectedFileId]: { strategy: strategyId, options },
    }));
    
    // Update legacy state for backward compatibility
    if (options.maxTokens) setChunkSize(options.maxTokens);
    if (options.overlapTokens) setOverlapSize(options.overlapTokens);
    if (options.windowSize) setChunkSize(options.windowSize);
    if (options.overlapSize) setOverlapSize(options.overlapSize);
    
    await rechunkWithStrategy(selectedFileId, strategyId, options);
  };

  const handleMetadataChange = (metadata: ChunkMetadata) => {
    if (!selectedFileId || !selectedChunkId) return;

    const fileChunks = chunksData[selectedFileId] || [];
    const updatedChunks = fileChunks.map((chunk) => (chunk.id === selectedChunkId ? { ...chunk, metadata } : chunk));

    setChunksData({
      ...chunksData,
      [selectedFileId]: updatedChunks,
    });
  };

  const handleApplyMetadataToAll = (metadata: ChunkMetadata) => {
    if (!selectedFileId) return;

    const fileChunks = chunksData[selectedFileId] || [];
    const updatedChunks = fileChunks.map((chunk) => ({
      ...chunk,
      metadata: { ...metadata },
    }));

    setChunksData({
      ...chunksData,
      [selectedFileId]: updatedChunks,
    });

    toast({
      title: "Metadata applied",
      description: `Applied metadata to all ${updatedChunks.length} chunks`,
    });
  };

  const handleReorderChunks = (reorderedChunks: Chunk[]) => {
    if (!selectedFileId) return;

    setChunksData({
      ...chunksData,
      [selectedFileId]: reorderedChunks,
    });

    toast({
      title: "Chunks reordered",
      description: "Chunk order updated successfully",
    });
  };

  const handleDeleteChunk = (chunkId: string) => {
    if (!selectedFileId) return;

    const fileChunks = chunksData[selectedFileId] || [];
    const updatedChunks = fileChunks.filter((chunk) => chunk.id !== chunkId);

    setChunksData({
      ...chunksData,
      [selectedFileId]: updatedChunks,
    });

    // Select another chunk or null if no chunks left
    if (updatedChunks.length > 0) {
      setSelectedChunkId(updatedChunks[0].id);
    } else {
      setSelectedChunkId(null);
    }

    toast({
      title: "Chunk deleted",
      description: "Chunk removed successfully",
    });
  };

  const handleStartEditFileName = () => {
    if (!selectedFileId) return;
    const currentFile = files.find((f) => f.id === selectedFileId);
    if (currentFile) {
      setEditingFileName(currentFile.name);
      setIsEditingFileName(true);
    }
  };

  const handleSaveFileName = () => {
    if (!selectedFileId || !editingFileName.trim()) {
      setIsEditingFileName(false);
      return;
    }

    const updatedFiles = files.map((file) =>
      file.id === selectedFileId ? { ...file, name: editingFileName.trim() } : file,
    );

    setFiles(updatedFiles);
    setIsEditingFileName(false);

    toast({
      title: "Document renamed",
      description: `Document renamed to "${editingFileName.trim()}"`,
    });
  };

  const handleCancelEditFileName = () => {
    setIsEditingFileName(false);
    setEditingFileName("");
  };

  const handleTitleChange = (chunkId: string, newTitle: string) => {
    if (!selectedFileId) return;

    const fileChunks = chunksData[selectedFileId] || [];
    const updatedChunks = fileChunks.map((chunk) => (chunk.id === chunkId ? { ...chunk, title: newTitle } : chunk));

    setChunksData({
      ...chunksData,
      [selectedFileId]: updatedChunks,
    });

    toast({
      title: "Chunk title updated",
      description: `Title changed to "${newTitle}"`,
    });
  };

  const currentFileName = files.find((f) => f.id === selectedFileId)?.name || "document";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div
        className={`h-full border-r border-border bg-sidebar flex flex-col transition-all duration-300 relative ${
          sidebarCollapsed ? "w-12" : "w-80"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          {!sidebarCollapsed && <Logo size="md" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`h-8 w-8 ${sidebarCollapsed ? "mx-auto" : ""}`}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        {!sidebarCollapsed && (
          <>
            <div className="flex-1 overflow-y-auto pb-16">
              {files.length > 0 && (
                <FileList files={files} selectedFileId={selectedFileId} onSelectFile={handleSelectFile} />
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-sidebar">
              <FileUploader onFileLoad={handleFileLoad} onOpenFile={handleOpenFile} />
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 p-10 border-b border-border bg-background flex items-center justify-between px-6">
          {isEditingFileName ? (
            <input
              type="text"
              value={editingFileName}
              onChange={(e) => setEditingFileName(e.target.value)}
              onBlur={handleSaveFileName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveFileName();
                } else if (e.key === "Escape") {
                  handleCancelEditFileName();
                }
              }}
              autoFocus
              className="text-sm font-semibold text-foreground bg-transparent border-b border-primary focus:outline-none"
            />
          ) : (
            <h1
              className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={handleStartEditFileName}
              title="Click to rename"
            >
              {selectedFileId ? currentFileName : "No Document Selected"}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <DocumentMetadataDialog globalMetadata={globalMetadata} onApplyToAll={handleApplyMetadataToAll} />
            <SettingsDialog
              chunkSize={chunkSize}
              overlapSize={overlapSize}
              selectedStrategy={selectedFileId ? (fileChunkingConfig[selectedFileId]?.strategy || "fixed-size") : "fixed-size"}
              strategyOptions={selectedFileId ? (fileChunkingConfig[selectedFileId]?.options) : undefined}
              onChunkSizeChange={handleChunkSizeChange}
              onOverlapSizeChange={handleOverlapSizeChange}
              onStrategyChange={handleStrategyChange}
            />
            {currentChunks.length > 0 && (
              <ExportDialog 
                ref={exportDialogRef}
                chunks={currentChunks} 
                fileName={currentFileName} 
                globalMetadata={globalMetadata} 
              />
            )}
          </div>
        </div>

        {/* Chunking Toolbar - only show when document is selected */}
        {selectedFileId && (
          <ChunkingToolbar
            selectedStrategy={fileChunkingConfig[selectedFileId]?.strategy || "fixed-size"}
            strategyOptions={fileChunkingConfig[selectedFileId]?.options}
            onStrategyChange={handleStrategyChange}
            disabled={isLoading}
          />
        )}

        <div className="flex-1 flex flex-row min-w-0 overflow-hidden">
          <div className="w-[40%] h-full border-r border-border">
            <ChunkList
              chunks={currentChunks}
              selectedChunkId={selectedChunkId}
              onSelectChunk={handleSelectChunk}
              onAddChunk={handleAddChunk}
              onReorderChunks={handleReorderChunks}
            />
          </div>

          <div className="flex-1 min-w-0">
            <MarkdownEditor
              chunk={currentChunk}
              onContentChange={handleContentChange}
              onDeleteChunk={handleDeleteChunk}
              onTitleChange={handleTitleChange}
            />
          </div>
        </div>
      </div>

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      {isLoading && <LoadingOverlay message={loadingMessage} progress={loadingProgress} />}
    </div>
  );
};

export default Index;

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Download, FileJson, FileText, File, Files } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Input } from "./ui/input";
import { Chunk, GlobalMetadata } from "@/types";
import { formatChunkWithFrontMatter } from "@/lib/chunking";
import { htmlToMarkdown, stripHtmlTags } from "@/lib/htmlToMarkdown";
import { useToast } from "@/hooks/use-toast";

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

interface ExportDialogProps {
  chunks: Chunk[];
  fileName: string;
  globalMetadata: GlobalMetadata;
}

export interface ExportDialogRef {
  trigger: () => void;
}

type ExportFormat = "json" | "markdown" | "txt";
type ExportMode = "single" | "multiple";

export const ExportDialog = forwardRef<ExportDialogRef, ExportDialogProps>(
  ({ chunks, fileName, globalMetadata }, ref) => {
    const [selectedChunks, setSelectedChunks] = useState<Set<string>>(new Set());
    const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
    const [exportMode, setExportMode] = useState<ExportMode>("single");
    const [selectAll, setSelectAll] = useState(false);
    const [filePrefix, setFilePrefix] = useState("");
    const [fileSeparator, setFileSeparator] = useState("_");
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    // Expose trigger method for menu integration
    useImperativeHandle(ref, () => ({
      trigger: () => setOpen(true),
    }));

  const sanitizeFileName = (name: string): string => {
    return name.replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedChunks(new Set(chunks.map(c => c.id)));
    } else {
      setSelectedChunks(new Set());
    }
  };

  const handleToggleChunk = (chunkId: string) => {
    const newSelected = new Set(selectedChunks);
    if (newSelected.has(chunkId)) {
      newSelected.delete(chunkId);
    } else {
      newSelected.add(chunkId);
    }
    setSelectedChunks(newSelected);
    setSelectAll(newSelected.size === chunks.length);
  };

  // Web fallback: download file using browser API
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Electron: save file using native dialog
  const saveFileElectron = async (content: string, defaultFilename: string, extension: string): Promise<boolean> => {
    if (!isElectron || !window.electronAPI) {
      return false;
    }

    try {
      const filePath = await window.electronAPI.saveFile({
        defaultPath: defaultFilename,
        filters: [
          { name: getFormatName(extension), extensions: [extension] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!filePath) {
        // User cancelled
        return false;
      }

      await window.electronAPI.saveFileContent(filePath, content);
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Error saving file",
        description: "Failed to save the file",
        variant: "destructive",
      });
      return false;
    }
  };

  // Electron: save multiple files to directory
  const saveFilesToDirectory = async (
    files: Array<{ content: string; filename: string }>
  ): Promise<boolean> => {
    if (!isElectron || !window.electronAPI) {
      return false;
    }

    try {
      const directoryPath = await window.electronAPI.openDirectory();
      if (!directoryPath) {
        // User cancelled
        return false;
      }

      // Save all files to the selected directory
      for (const file of files) {
        const filePath = `${directoryPath}/${file.filename}`;
        await window.electronAPI.saveFileContent(filePath, file.content);
      }

      return true;
    } catch (error) {
      console.error('Error saving files:', error);
      toast({
        title: "Error saving files",
        description: "Failed to save one or more files",
        variant: "destructive",
      });
      return false;
    }
  };

  const getFormatName = (extension: string): string => {
    switch (extension) {
      case 'json':
        return 'JSON Files';
      case 'md':
        return 'Markdown Files';
      case 'txt':
        return 'Text Files';
      default:
        return 'All Files';
    }
  };

  const handleExport = async () => {
    if (selectedChunks.size === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to export",
        variant: "destructive",
      });
      return;
    }

    const chunksToExport = chunks.filter(c => selectedChunks.has(c.id));
    let mimeType = "";
    let extension = "";

    switch (exportFormat) {
      case "json":
        mimeType = "application/json";
        extension = "json";
        break;
      case "markdown":
        mimeType = "text/markdown";
        extension = "md";
        break;
      case "txt":
        mimeType = "text/plain";
        extension = "txt";
        break;
    }

    if (exportMode === "single") {
      // Single file export
      let content = "";
      switch (exportFormat) {
        case "json":
          content = JSON.stringify(chunksToExport, null, 2);
          break;
        case "markdown":
          content = chunksToExport
            .map(c => {
              const markdownContent = htmlToMarkdown(c.content);
              const formatted = formatChunkWithFrontMatter(
                { ...c, content: markdownContent },
                globalMetadata
              );
              return formatted;
            })
            .join("\n\n---\n\n");
          break;
        case "txt":
          content = chunksToExport
            .map(c => {
              const plainText = stripHtmlTags(c.content);
              return `${c.title}\n${"=".repeat(c.title.length)}\n\n${plainText}`;
            })
            .join("\n\n\n");
          break;
      }
      
      const baseFileName = fileName.replace(/\.(docx|pptx|pdf)$/i, "");
      const defaultFilename = `${baseFileName}_chunks.${extension}`;

      // Try Electron save dialog first, fallback to web download
      if (isElectron && window.electronAPI) {
        const saved = await saveFileElectron(content, defaultFilename, extension);
        if (!saved) {
          // User cancelled, don't show success toast
          return;
        }
      } else {
        // Web fallback
        downloadFile(content, defaultFilename, mimeType);
      }

      toast({
        title: "Export successful",
        description: `Exported ${selectedChunks.size} chunk(s) as ${exportFormat.toUpperCase()}`,
      });
    } else {
      // Multiple files export
      const filesToSave: Array<{ content: string; filename: string }> = [];

      chunksToExport.forEach((chunk) => {
        let content = "";
        switch (exportFormat) {
          case "json":
            content = JSON.stringify([chunk], null, 2);
            break;
          case "markdown":
            const markdownContent = htmlToMarkdown(chunk.content);
            content = formatChunkWithFrontMatter(
              { ...chunk, content: markdownContent },
              globalMetadata
            );
            break;
          case "txt":
            const plainText = stripHtmlTags(chunk.content);
            content = `${chunk.title}\n${"=".repeat(chunk.title.length)}\n\n${plainText}`;
            break;
        }

        const sanitizedTitle = sanitizeFileName(chunk.title);
        const prefix = filePrefix ? `${sanitizeFileName(filePrefix)}${fileSeparator}` : "";
        const filename = `${prefix}${sanitizedTitle}.${extension}`;
        filesToSave.push({ content, filename });
      });

      // Try Electron directory picker first, fallback to web downloads
      if (isElectron && window.electronAPI) {
        const saved = await saveFilesToDirectory(filesToSave);
        if (!saved) {
          // User cancelled, don't show success toast
          return;
        }
      } else {
        // Web fallback: download each file individually
        filesToSave.forEach((file) => {
          downloadFile(file.content, file.filename, mimeType);
        });
      }

      toast({
        title: "Export successful",
        description: `Exported ${selectedChunks.size} file(s) as ${exportFormat.toUpperCase()}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Chunks</DialogTitle>
          <DialogDescription>
            Select chunks and format for export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label>Export Mode</Label>
            <RadioGroup value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                  <File className="w-4 h-4" />
                  Single file (all chunks combined)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="flex items-center gap-2 cursor-pointer">
                  <Files className="w-4 h-4" />
                  Multiple files (one per chunk)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {exportMode === "multiple" && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="file-prefix" className="text-xs">
                  File Prefix (optional)
                </Label>
                <Input
                  id="file-prefix"
                  placeholder="e.g., project_name"
                  value={filePrefix}
                  onChange={(e) => setFilePrefix(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-separator" className="text-xs">
                  Separator
                </Label>
                <Input
                  id="file-separator"
                  placeholder="_"
                  value={fileSeparator}
                  onChange={(e) => setFileSeparator(e.target.value)}
                  className="h-8 text-sm"
                  maxLength={3}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Example: {filePrefix ? `${sanitizeFileName(filePrefix)}${fileSeparator}` : ""}chunk_title.{exportFormat === "markdown" ? "md" : exportFormat}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="w-4 h-4" />
                  JSON (with metadata)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="markdown" />
                <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  Markdown
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="flex items-center gap-2 cursor-pointer">
                  <File className="w-4 h-4" />
                  Plain Text
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Select Chunks ({selectedChunks.size}/{chunks.length})</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-sm">
                  Select All
                </Label>
              </div>
            </div>
            <div className="border rounded-md p-2 space-y-1 flex-1 overflow-y-auto">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="flex items-start gap-2 p-2 hover:bg-accent rounded">
                  <Checkbox
                    id={chunk.id}
                    checked={selectedChunks.has(chunk.id)}
                    onCheckedChange={() => handleToggleChunk(chunk.id)}
                  />
                  <Label htmlFor={chunk.id} className="flex-1 cursor-pointer text-sm">
                    <div className="font-medium">{chunk.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {chunk.tokens} tokens
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setSelectedChunks(new Set())}>
            Clear Selection
          </Button>
          <Button onClick={handleExport} disabled={selectedChunks.size === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export {selectedChunks.size > 0 && `(${selectedChunks.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ExportDialog.displayName = "ExportDialog";

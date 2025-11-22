import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileLoad: (fileName: string, arrayBuffer: ArrayBuffer, filePath?: string) => void;
  onOpenFile?: () => void; // Optional handler for opening file (used by menu)
}

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

export const FileUploader = ({ onFileLoad, onOpenFile }: FileUploaderProps) => {
  const { toast } = useToast();

  const handleElectronFileOpen = async () => {
    // If parent component provides handler, use it (for menu integration)
    if (onOpenFile) {
      onOpenFile();
      return;
    }

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

      onFileLoad(fileName, data, filePath);
      toast({
        title: "File loaded",
        description: `Successfully loaded ${fileName}`,
      });
    } catch (error) {
      console.error('Error opening file:', error);
      toast({
        title: "Error loading file",
        description: "Failed to read the file",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".docx", ".pptx", ".pdf"];
    const isValid = validExtensions.some((ext) => file.name.endsWith(ext));

    if (!isValid) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .docx, .pptx, or .pdf file",
        variant: "destructive",
      });
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      onFileLoad(file.name, arrayBuffer);
      toast({
        title: "File loaded",
        description: `Successfully loaded ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Error loading file",
        description: "Failed to read the file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-3">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={isElectron ? handleElectronFileOpen : undefined}
      >
        <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center gap-2 w-full">
          <Upload className="w-4 h-4" />
          Load Knowledge Source
        </label>
      </Button>
      <input 
        id="file-upload" 
        type="file" 
        accept=".docx,.pptx,.pdf" 
        onChange={handleFileInput} 
        className="hidden" 
      />
    </div>
  );
};

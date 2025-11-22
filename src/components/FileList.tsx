import { DocFile } from "@/types";
import { FileText } from "lucide-react";

interface FileListProps {
  files: DocFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

export const FileList = ({ files, selectedFileId, onSelectFile }: FileListProps) => {
  return (
    <div className="flex-1 overflow-y-auto">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          return (
            <button
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`w-full px-4 py-3 flex items-start gap-3 text-left item-hover border-l-2 transition-all ${
                isSelected
                  ? "item-selected"
                  : "border-l-transparent"
              }`}
            >
              <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                isSelected ? "text-primary" : "text-muted-foreground"
              }`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isSelected ? "text-foreground" : "text-sidebar-foreground"
                }`}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  .{file.type}
                </div>
              </div>
            </button>
          );
        })}
    </div>
  );
};

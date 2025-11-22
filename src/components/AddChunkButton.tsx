import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddChunkButtonProps {
  onAddChunk: () => void;
}

export const AddChunkButton = ({ onAddChunk }: AddChunkButtonProps) => {
  return (
    <div className="p-4 flex justify-center border-t border-editor-border bg-background flex-shrink-0">
      <Button
        onClick={onAddChunk}
        size="icon"
        variant="outline"
        className="rounded-full h-12 w-12"
        aria-label="Add chunk"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
};

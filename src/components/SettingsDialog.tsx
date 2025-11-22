import { Settings } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SettingsDialogProps {
  chunkSize: number;
  overlapSize: number;
  onChunkSizeChange: (size: number) => void;
  onOverlapSizeChange: (size: number) => void;
}

export const SettingsDialog = ({
  chunkSize,
  overlapSize,
  onChunkSizeChange,
  onOverlapSizeChange,
}: SettingsDialogProps) => {
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure chunking settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chunking Settings</DialogTitle>
          <DialogDescription>
            Configure RAG-compliant chunking parameters for optimal vector database performance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="chunk-size">Chunk Size (tokens)</Label>
              <Input
                id="chunk-size"
                type="number"
                value={chunkSize}
                onChange={(e) => onChunkSizeChange(Number(e.target.value))}
                className="w-20 h-8"
                min={100}
                max={2000}
              />
            </div>
            <Slider
              value={[chunkSize]}
              onValueChange={(value) => onChunkSizeChange(value[0])}
              min={100}
              max={2000}
              step={50}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 800-1000 tokens for optimal RAG performance
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="overlap-size">Overlap Size (tokens)</Label>
              <Input
                id="overlap-size"
                type="number"
                value={overlapSize}
                onChange={(e) => onOverlapSizeChange(Number(e.target.value))}
                className="w-20 h-8"
                min={0}
                max={500}
              />
            </div>
            <Slider
              value={[overlapSize]}
              onValueChange={(value) => onOverlapSizeChange(value[0])}
              min={0}
              max={500}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 100-200 tokens to maintain context between chunks
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

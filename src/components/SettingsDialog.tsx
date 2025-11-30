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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getAllStrategies } from "@/lib/chunking";
import { ChunkingOptions } from "@/lib/chunking/strategy";
import { useState, useEffect } from "react";

interface SettingsDialogProps {
  chunkSize: number;
  overlapSize: number;
  selectedStrategy?: string;
  strategyOptions?: ChunkingOptions;
  onChunkSizeChange: (size: number) => void;
  onOverlapSizeChange: (size: number) => void;
  onStrategyChange?: (strategyId: string, options: ChunkingOptions) => void;
}

export const SettingsDialog = ({
  chunkSize,
  overlapSize,
  selectedStrategy = "fixed-size",
  strategyOptions,
  onChunkSizeChange,
  onOverlapSizeChange,
  onStrategyChange,
}: SettingsDialogProps) => {
  const strategies = getAllStrategies();
  const [currentStrategy, setCurrentStrategy] = useState(selectedStrategy);
  const [currentOptions, setCurrentOptions] = useState<ChunkingOptions>(() => {
    const strategy = strategies.find(s => s.id === selectedStrategy);
    return strategyOptions || strategy?.defaultOptions || { maxTokens: chunkSize, overlapTokens: overlapSize };
  });

  // Update options when strategy changes
  useEffect(() => {
    const strategy = strategies.find(s => s.id === currentStrategy);
    if (strategy) {
      setCurrentOptions({
        ...strategy.defaultOptions,
        ...strategyOptions,
        maxTokens: chunkSize,
        overlapTokens: overlapSize,
      });
    }
  }, [currentStrategy, chunkSize, overlapSize, strategyOptions, strategies]);

  const handleStrategyChange = (strategyId: string) => {
    setCurrentStrategy(strategyId);
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy && onStrategyChange) {
      const newOptions = {
        ...strategy.defaultOptions,
        maxTokens: chunkSize,
        overlapTokens: overlapSize,
      };
      setCurrentOptions(newOptions);
      onStrategyChange(strategyId, newOptions);
    }
  };

  const handleOptionChange = (key: string, value: number | string | boolean) => {
    const newOptions = { ...currentOptions, [key]: value };
    setCurrentOptions(newOptions);
    if (onStrategyChange) {
      onStrategyChange(currentStrategy, newOptions);
    }
    // Also update legacy handlers for backward compatibility
    if (key === "maxTokens" && typeof value === "number") {
      onChunkSizeChange(value);
    } else if (key === "overlapTokens" && typeof value === "number") {
      onOverlapSizeChange(value);
    } else if (key === "windowSize" && typeof value === "number") {
      onChunkSizeChange(value);
    } else if (key === "overlapSize" && typeof value === "number") {
      onOverlapSizeChange(value);
    }
  };

  const currentStrategyObj = strategies.find(s => s.id === currentStrategy);

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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chunking Settings</DialogTitle>
          <DialogDescription>
            Configure RAG-compliant chunking parameters for optimal vector database performance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Strategy Selector */}
          <div className="space-y-2">
            <Label htmlFor="strategy">Chunking Strategy</Label>
            <Select value={currentStrategy} onValueChange={handleStrategyChange}>
              <SelectTrigger id="strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{strategy.name}</span>
                      <span className="text-xs text-muted-foreground">{strategy.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentStrategyObj && (
              <p className="text-xs text-muted-foreground">
                {currentStrategyObj.description}
              </p>
            )}
          </div>

          {/* Dynamic Options based on Strategy */}
          <div className="space-y-4 border-t pt-4">
            {/* Max Tokens / Window Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-tokens">
                  {currentStrategy === "sliding-window" ? "Window Size" : "Max Tokens"} (tokens)
                </Label>
                <Input
                  id="max-tokens"
                  type="number"
                  value={currentOptions.maxTokens || currentOptions.windowSize || chunkSize}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const key = currentStrategy === "sliding-window" ? "windowSize" : "maxTokens";
                    handleOptionChange(key, value);
                  }}
                  className="w-20 h-8"
                  min={100}
                  max={2000}
                />
              </div>
              <Slider
                value={[currentOptions.maxTokens || currentOptions.windowSize || chunkSize]}
                onValueChange={(value) => {
                  const key = currentStrategy === "sliding-window" ? "windowSize" : "maxTokens";
                  handleOptionChange(key, value[0]);
                }}
                min={100}
                max={2000}
                step={50}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 800-1000 tokens for optimal RAG performance
              </p>
            </div>

            {/* Overlap Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="overlap-size">Overlap Size (tokens)</Label>
                <Input
                  id="overlap-size"
                  type="number"
                  value={currentOptions.overlapTokens || currentOptions.overlapSize || overlapSize}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    const key = currentStrategy === "sliding-window" ? "overlapSize" : "overlapTokens";
                    handleOptionChange(key, value);
                  }}
                  className="w-20 h-8"
                  min={0}
                  max={500}
                />
              </div>
              <Slider
                value={[currentOptions.overlapTokens || currentOptions.overlapSize || overlapSize]}
                onValueChange={(value) => {
                  const key = currentStrategy === "sliding-window" ? "overlapSize" : "overlapTokens";
                  handleOptionChange(key, value[0]);
                }}
                min={0}
                max={500}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 100-200 tokens to maintain context between chunks
              </p>
            </div>

            {/* Strategy-specific options */}
            {currentStrategy === "heading-aware" && (
              <div className="space-y-3 border-t pt-3">
                <Label>Sub-chunking Strategy</Label>
                <Select
                  value={currentOptions.subChunkingStrategy || "paragraph"}
                  onValueChange={(value) => handleOptionChange("subChunkingStrategy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paragraph">Paragraph</SelectItem>
                    <SelectItem value="sentence">Sentence</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How to split sections that exceed max tokens
                </p>
              </div>
            )}

            {currentStrategy === "paragraph-aware" && (
              <div className="space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <Label htmlFor="min-paragraphs">Min Paragraphs per Chunk</Label>
                  <Input
                    id="min-paragraphs"
                    type="number"
                    value={currentOptions.minParagraphsPerChunk || 1}
                    onChange={(e) => handleOptionChange("minParagraphsPerChunk", Number(e.target.value))}
                    className="w-20 h-8"
                    min={1}
                    max={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-paragraphs">Max Paragraphs per Chunk</Label>
                  <Input
                    id="max-paragraphs"
                    type="number"
                    value={currentOptions.maxParagraphsPerChunk || 10}
                    onChange={(e) => handleOptionChange("maxParagraphsPerChunk", Number(e.target.value))}
                    className="w-20 h-8"
                    min={1}
                    max={20}
                  />
                </div>
              </div>
            )}

            {currentStrategy === "sliding-window" && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="preserve-word-boundaries"
                    checked={currentOptions.preserveWordBoundaries !== false}
                    onChange={(e) => handleOptionChange("preserveWordBoundaries", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="preserve-word-boundaries" className="cursor-pointer">
                    Preserve Word Boundaries
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="preserve-sentence-boundaries"
                    checked={currentOptions.preserveSentenceBoundaries === true}
                    onChange={(e) => handleOptionChange("preserveSentenceBoundaries", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="preserve-sentence-boundaries" className="cursor-pointer">
                    Preserve Sentence Boundaries
                  </Label>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

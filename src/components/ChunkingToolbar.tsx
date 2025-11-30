import { useState, useEffect } from "react";
import { Info, Check } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
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
import { Button } from "./ui/button";
import { getAllStrategies } from "@/lib/chunking";
import { ChunkingOptions } from "@/lib/chunking/strategy";

interface ChunkingToolbarProps {
  selectedStrategy?: string;
  strategyOptions?: ChunkingOptions;
  onStrategyChange: (strategyId: string, options: ChunkingOptions) => void;
  disabled?: boolean;
}

export const ChunkingToolbar = ({
  selectedStrategy = "fixed-size",
  strategyOptions,
  onStrategyChange,
  disabled = false,
}: ChunkingToolbarProps) => {
  const strategies = getAllStrategies();
  const [currentStrategy, setCurrentStrategy] = useState(selectedStrategy);
  const [currentOptions, setCurrentOptions] = useState<ChunkingOptions>(() => {
    const strategy = strategies.find(s => s.id === selectedStrategy);
    return strategyOptions || strategy?.defaultOptions || { maxTokens: 1000, overlapTokens: 150 };
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [lastAppliedStrategy, setLastAppliedStrategy] = useState(selectedStrategy);
  const [lastAppliedOptions, setLastAppliedOptions] = useState<ChunkingOptions | undefined>(strategyOptions);

  // Update when props change (only if they're different from what we last applied)
  useEffect(() => {
    // Only sync from props if they've actually changed from what we last applied
    // This prevents resetting when user makes local changes
    if (selectedStrategy !== lastAppliedStrategy || 
        JSON.stringify(strategyOptions) !== JSON.stringify(lastAppliedOptions)) {
      setCurrentStrategy(selectedStrategy);
      const strategy = strategies.find(s => s.id === selectedStrategy);
      setCurrentOptions(strategyOptions || strategy?.defaultOptions || { maxTokens: 1000, overlapTokens: 150 });
      setHasChanges(false);
      setLastAppliedStrategy(selectedStrategy);
      setLastAppliedOptions(strategyOptions);
    }
  }, [selectedStrategy, strategyOptions, strategies, lastAppliedStrategy, lastAppliedOptions]);

  const handleStrategyChange = (strategyId: string) => {
    setCurrentStrategy(strategyId);
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      const newOptions = {
        ...strategy.defaultOptions,
        maxTokens: currentOptions.maxTokens || strategy.defaultOptions.maxTokens || 1000,
        overlapTokens: currentOptions.overlapTokens || strategy.defaultOptions.overlapTokens || 150,
      };
      setCurrentOptions(newOptions);
      setHasChanges(true);
    }
  };

  const handleOptionChange = (key: string, value: number | string | boolean) => {
    const newOptions = { ...currentOptions, [key]: value };
    setCurrentOptions(newOptions);
    setHasChanges(true);
  };

  const handleApply = () => {
    onStrategyChange(currentStrategy, currentOptions);
    setHasChanges(false);
    setLastAppliedStrategy(currentStrategy);
    setLastAppliedOptions(currentOptions);
  };

  const currentStrategyObj = strategies.find(s => s.id === currentStrategy);

  // Tooltip content for each option
  const tooltips = {
    strategy: currentStrategyObj?.description || "Select a chunking strategy based on your document type",
    maxTokens: "Maximum number of tokens per chunk. Recommended: 800-1000 for optimal RAG performance.",
    overlapTokens: "Number of tokens to overlap between chunks. Recommended: 100-200 to maintain context.",
    windowSize: "Size of each sliding window in tokens. Recommended: 800-1000 tokens.",
    overlapSize: "Overlap between sliding windows in tokens. Recommended: 100-200 tokens.",
    subChunkingStrategy: "How to split sections that exceed max tokens. Paragraph: preserves paragraph boundaries. Sentence: splits by sentences.",
    minParagraphsPerChunk: "Minimum number of paragraphs to include in each chunk. Prevents overly small chunks.",
    maxParagraphsPerChunk: "Maximum number of paragraphs per chunk. Prevents chunks from becoming too large.",
    preserveWordBoundaries: "Ensures window boundaries don't split words. Recommended for readability.",
    preserveSentenceBoundaries: "Prefer to place window boundaries at sentence ends. Recommended for better semantic coherence.",
  };

  const InfoIcon = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="border-b border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Strategy Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="chunking-strategy" className="text-xs font-medium whitespace-nowrap">
            Chunking Mode:
          </Label>
          <Select
            value={currentStrategy}
            onValueChange={handleStrategyChange}
            disabled={disabled}
          >
            <SelectTrigger id="chunking-strategy" className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy) => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InfoIcon content={tooltips.strategy} />
        </div>

        {/* Max Tokens / Window Size */}
        <div className="flex items-center gap-2">
          <Label htmlFor="max-tokens" className="text-xs font-medium whitespace-nowrap">
            {currentStrategy === "sliding-window" ? "Window Size:" : "Max Tokens:"}
          </Label>
          <Input
            id="max-tokens"
            type="number"
            value={currentOptions.maxTokens || currentOptions.windowSize || 1000}
            onChange={(e) => {
              const value = Number(e.target.value);
              const key = currentStrategy === "sliding-window" ? "windowSize" : "maxTokens";
              handleOptionChange(key, value);
            }}
            className="w-20 h-7 text-xs"
            min={100}
            max={2000}
            disabled={disabled}
          />
          <InfoIcon content={currentStrategy === "sliding-window" ? tooltips.windowSize : tooltips.maxTokens} />
        </div>

        {/* Overlap Size */}
        <div className="flex items-center gap-2">
          <Label htmlFor="overlap-size" className="text-xs font-medium whitespace-nowrap">
            Overlap:
          </Label>
          <Input
            id="overlap-size"
            type="number"
            value={currentOptions.overlapTokens || currentOptions.overlapSize || 150}
            onChange={(e) => {
              const value = Number(e.target.value);
              const key = currentStrategy === "sliding-window" ? "overlapSize" : "overlapTokens";
              handleOptionChange(key, value);
            }}
            className="w-20 h-7 text-xs"
            min={0}
            max={500}
            disabled={disabled}
          />
          <InfoIcon content={currentStrategy === "sliding-window" ? tooltips.overlapSize : tooltips.overlapTokens} />
        </div>

        {/* Strategy-specific options */}
        {currentStrategy === "heading-aware" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="sub-chunking" className="text-xs font-medium whitespace-nowrap">
              Sub-chunking:
            </Label>
            <Select
              value={currentOptions.subChunkingStrategy || "paragraph"}
              onValueChange={(value) => handleOptionChange("subChunkingStrategy", value)}
              disabled={disabled}
            >
              <SelectTrigger id="sub-chunking" className="w-[120px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="sentence">Sentence</SelectItem>
              </SelectContent>
            </Select>
            <InfoIcon content={tooltips.subChunkingStrategy} />
          </div>
        )}

        {currentStrategy === "paragraph-aware" && (
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="min-paragraphs" className="text-xs font-medium whitespace-nowrap">
                Min Paragraphs:
              </Label>
              <Input
                id="min-paragraphs"
                type="number"
                value={currentOptions.minParagraphsPerChunk || 1}
                onChange={(e) => handleOptionChange("minParagraphsPerChunk", Number(e.target.value))}
                className="w-16 h-7 text-xs"
                min={1}
                max={10}
                disabled={disabled}
              />
              <InfoIcon content={tooltips.minParagraphsPerChunk} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="max-paragraphs" className="text-xs font-medium whitespace-nowrap">
                Max Paragraphs:
              </Label>
              <Input
                id="max-paragraphs"
                type="number"
                value={currentOptions.maxParagraphsPerChunk || 10}
                onChange={(e) => handleOptionChange("maxParagraphsPerChunk", Number(e.target.value))}
                className="w-16 h-7 text-xs"
                min={1}
                max={20}
                disabled={disabled}
              />
              <InfoIcon content={tooltips.maxParagraphsPerChunk} />
            </div>
          </>
        )}

        {currentStrategy === "sliding-window" && (
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="preserve-word-boundaries" className="text-xs font-medium whitespace-nowrap flex items-center gap-1">
                <input
                  type="checkbox"
                  id="preserve-word-boundaries"
                  checked={currentOptions.preserveWordBoundaries !== false}
                  onChange={(e) => handleOptionChange("preserveWordBoundaries", e.target.checked)}
                  className="rounded w-3.5 h-3.5"
                  disabled={disabled}
                />
                Word Boundaries
              </Label>
              <InfoIcon content={tooltips.preserveWordBoundaries} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="preserve-sentence-boundaries" className="text-xs font-medium whitespace-nowrap flex items-center gap-1">
                <input
                  type="checkbox"
                  id="preserve-sentence-boundaries"
                  checked={currentOptions.preserveSentenceBoundaries === true}
                  onChange={(e) => handleOptionChange("preserveSentenceBoundaries", e.target.checked)}
                  className="rounded w-3.5 h-3.5"
                  disabled={disabled}
                />
                Sentence Boundaries
              </Label>
              <InfoIcon content={tooltips.preserveSentenceBoundaries} />
            </div>
          </>
        )}

        {/* Apply Button */}
        {hasChanges && (
          <Button
            onClick={handleApply}
            size="sm"
            className="h-7 text-xs ml-auto"
            disabled={disabled}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Apply Changes
          </Button>
        )}
      </div>
    </div>
  );
};


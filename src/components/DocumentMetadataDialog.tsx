import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tags, Plus, X } from "lucide-react";
import { ChunkMetadata, GlobalMetadata } from "@/types";
import { useState } from "react";

interface DocumentMetadataDialogProps {
  globalMetadata: GlobalMetadata;
  onApplyToAll: (metadata: ChunkMetadata) => void;
}

export const DocumentMetadataDialog = ({
  globalMetadata,
  onApplyToAll,
}: DocumentMetadataDialogProps) => {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<ChunkMetadata>({ ...globalMetadata });
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  const defaultFields = ["topic", "category", "domain-area"];

  const handleFieldChange = (key: string, value: string) => {
    setMetadata({
      ...metadata,
      [key]: value || undefined,
    });
  };

  const handleAddCustomField = () => {
    if (customKey.trim()) {
      setMetadata({
        ...metadata,
        [customKey]: customValue,
      });
      setCustomKey("");
      setCustomValue("");
    }
  };

  const handleRemoveField = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    setMetadata(newMetadata);
  };

  const handleApply = () => {
    onApplyToAll(metadata);
    setOpen(false);
  };

  const customFields = Object.keys(metadata || {}).filter(
    key => !defaultFields.includes(key)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tags className="h-4 w-4 mr-2" />
          Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Document Metadata</DialogTitle>
          <DialogDescription>
            Set metadata that will be applied to all chunks. You can edit individual chunk metadata directly in the markdown editor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Default Fields</h4>
            
            {defaultFields.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="text-xs">
                  {field.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </Label>
                <Input
                  id={field}
                  value={metadata?.[field] || ""}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={`Enter ${field}`}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>

          {customFields.length > 0 && (
            <div className="pt-3 border-t border-border space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Custom Fields</h4>
              {customFields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field} className="text-xs">
                      {field}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(field)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    id={field}
                    value={metadata?.[field] || ""}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border space-y-2">
            <Label className="text-xs font-semibold">Add Custom Field</Label>
            <div className="flex gap-2">
              <Input
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Field name"
                className="h-9 text-sm flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomField()}
              />
              <Input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Value"
                className="h-9 text-sm flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomField()}
              />
              <Button
                onClick={handleAddCustomField}
                size="sm"
                className="h-9"
                disabled={!customKey.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply to All Chunks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

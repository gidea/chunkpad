import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, X } from "lucide-react";
import { GlobalMetadata } from "@/types";
import { useState } from "react";

interface GlobalMetadataDialogProps {
  globalMetadata: GlobalMetadata;
  onGlobalMetadataChange: (metadata: GlobalMetadata) => void;
}

export const GlobalMetadataDialog = ({
  globalMetadata,
  onGlobalMetadataChange,
}: GlobalMetadataDialogProps) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAddField = () => {
    if (newKey.trim()) {
      onGlobalMetadataChange({
        ...globalMetadata,
        [newKey]: newValue,
      });
      setNewKey("");
      setNewValue("");
    }
  };

  const handleRemoveField = (key: string) => {
    const newMetadata = { ...globalMetadata };
    delete newMetadata[key];
    onGlobalMetadataChange(newMetadata);
  };

  const handleUpdateField = (key: string, value: string) => {
    onGlobalMetadataChange({
      ...globalMetadata,
      [key]: value,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Global Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Global Metadata Settings</DialogTitle>
          <DialogDescription>
            Define metadata fields that will be applied to all chunks by default.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.entries(globalMetadata).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No global metadata fields defined yet.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(globalMetadata).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`global-${key}`} className="text-sm">
                      {key}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(key)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    id={`global-${key}`}
                    value={value}
                    onChange={(e) => handleUpdateField(key, e.target.value)}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border space-y-3">
            <Label className="text-sm font-semibold">Add New Global Field</Label>
            <div className="space-y-2">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Field name (e.g., 'document-source', 'department')"
                className="h-9"
              />
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Default value"
                className="h-9"
              />
              <Button
                onClick={handleAddField}
                className="w-full"
                disabled={!newKey.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

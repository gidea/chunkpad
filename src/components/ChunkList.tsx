import { Chunk, ChunkMetadata } from "@/types";
import { FileCode, GripVertical, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddChunkButton } from "@/components/AddChunkButton";
import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
interface ChunkListProps {
  chunks: Chunk[];
  selectedChunkId: string | null;
  onSelectChunk: (chunkId: string) => void;
  onAddChunk: () => void;
  onReorderChunks: (chunks: Chunk[]) => void;
}
interface SortableChunkItemProps {
  chunk: Chunk;
  isSelected: boolean;
  onSelectChunk: (chunkId: string) => void;
}
const SortableChunkItem = ({
  chunk,
  isSelected,
  onSelectChunk
}: SortableChunkItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: chunk.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className={`group flex items-center gap-2 w-full border-l-2 transition-all ${isSelected ? "item-selected" : "border-l-transparent"}`}>
      <button {...attributes} {...listeners} className="px-2 py-3 cursor-grab active:cursor-grabbing group-hover:bg-muted/50 transition-colors flex items-center" aria-label="Drag to reorder">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <button onClick={() => onSelectChunk(chunk.id)} className="flex-1 py-3 pr-4 text-left item-hover transition-all">
        <div className="flex items-center gap-3">
          <FileCode className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium mb-1 flex items-center justify-between gap-2 ${isSelected ? "text-foreground" : "text-foreground/90"}`}>
              <span className="truncate">{chunk.title}</span>
              {chunk.tokens !== undefined && <span className="text-xs text-muted-foreground font-normal flex-shrink-0">{chunk.tokens}t</span>}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">{chunk.preview}</div>
          </div>
        </div>
      </button>
    </div>;
};
export const ChunkList = ({
  chunks,
  selectedChunkId,
  onSelectChunk,
  onAddChunk,
  onReorderChunks
}: ChunkListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = chunks.findIndex(c => c.id === active.id);
      const newIndex = chunks.findIndex(c => c.id === over.id);
      const reorderedChunks = arrayMove(chunks, oldIndex, newIndex);
      onReorderChunks(reorderedChunks);
    }
  };

  // Filter chunks based on search query
  const filteredChunks = searchQuery.trim() ? chunks.filter(chunk => {
    const query = searchQuery.toLowerCase();
    return chunk.title.toLowerCase().includes(query) || chunk.content.toLowerCase().includes(query) || chunk.preview.toLowerCase().includes(query);
  }) : chunks;
  return <div className="h-full flex flex-col editor-pane">
      <div className="border-b border-editor-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Chunks</h2>
            {chunks.length > 0 && <Badge variant="secondary" className="text-xs">
                {searchQuery.trim() ? filteredChunks.length : chunks.length}
              </Badge>}
          </div>
        </div>

        {chunks.length > 0 && <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search chunks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-9 h-9" />
              {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </Button>}
            </div>
          </div>}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pb-2">
        {chunks.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">
            No chunks yet. Click "Add Chunk" to create one.
          </div> : filteredChunks.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No chunks match "{searchQuery}"</p>
          </div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredChunks.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {filteredChunks.map(chunk => <SortableChunkItem key={chunk.id} chunk={chunk} isSelected={chunk.id === selectedChunkId} onSelectChunk={onSelectChunk} />)}
            </SortableContext>
          </DndContext>}
      </div>
      <div className="border-t border-editor-border bg-background">
        <AddChunkButton onAddChunk={onAddChunk} />
      </div>
    </div>;
};
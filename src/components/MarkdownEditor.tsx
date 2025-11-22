import { useEffect, useState } from "react";
import { Chunk } from "@/types";
import { FileCode, Trash2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { MenuBar } from "./MenuBar";
import { stringifyFrontMatter } from "@/lib/frontMatter";

interface MarkdownEditorProps {
  chunk: Chunk | null;
  onContentChange: (content: string) => void;
  onDeleteChunk: (chunkId: string) => void;
  onTitleChange: (chunkId: string, newTitle: string) => void;
}

const extensions = [
  StarterKit.configure({
    // Exclude Link extension since we configure it separately
    link: false,
  }),
  TextStyle,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
  Image,
  Link.configure({
    openOnClick: false,
  }),
  Superscript,
  Subscript,
];

export const MarkdownEditor = ({ chunk, onContentChange, onDeleteChunk, onTitleChange }: MarkdownEditorProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const editor = useEditor({
    extensions,
    content: chunk ? stringifyFrontMatter(chunk.metadata || {}, chunk.content) : "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  // Clean up editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Update editor content when chunk changes
  useEffect(() => {
    if (editor && chunk) {
      const contentWithFrontMatter = stringifyFrontMatter(chunk.metadata || {}, chunk.content);
      const currentContent = editor.getHTML();
      if (currentContent !== contentWithFrontMatter) {
        editor.commands.setContent(contentWithFrontMatter);
      }
    }
  }, [chunk?.id, chunk?.metadata, editor]);

  if (!chunk || !editor) {
    return (
      <div className="h-full editor-pane flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a chunk to start editing</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (chunk) {
      onDeleteChunk(chunk.id);
    }
    setShowDeleteDialog(false);
  };

  const handleStartEditTitle = () => {
    if (chunk) {
      setEditingTitle(chunk.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (chunk && editingTitle.trim()) {
      onTitleChange(chunk.id, editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle("");
  };

  return (
    <>
      <div className="h-full flex flex-col editor-pane">
        <div className="border-b border-editor-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTitle();
                    } else if (e.key === "Escape") {
                      handleCancelEditTitle();
                    }
                  }}
                  autoFocus
                  className="text-sm font-semibold text-foreground bg-transparent border-b border-primary focus:outline-none flex-1 min-w-0"
                />
              ) : (
                <h2
                  className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={handleStartEditTitle}
                  title="Click to rename"
                >
                  {chunk.title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {chunk.tokens !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {chunk.tokens} tokens
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Delete chunk"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <MenuBar editor={editor} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chunk?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chunk?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

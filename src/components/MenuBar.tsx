import { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  RemoveFormatting,
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Code2,
  Quote,
  Minus,
  WrapText,
  Undo,
  Redo,
} from "lucide-react";

interface MenuBarProps {
  editor: Editor;
}

export const MenuBar = ({ editor }: MenuBarProps) => {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold") ?? false,
      canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
      isItalic: ctx.editor.isActive("italic") ?? false,
      canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
      isStrike: ctx.editor.isActive("strike") ?? false,
      canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
      isCode: ctx.editor.isActive("code") ?? false,
      canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
      canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
      isParagraph: ctx.editor.isActive("paragraph") ?? false,
      isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
      isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
      isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
      isHeading4: ctx.editor.isActive("heading", { level: 4 }) ?? false,
      isHeading5: ctx.editor.isActive("heading", { level: 5 }) ?? false,
      isHeading6: ctx.editor.isActive("heading", { level: 6 }) ?? false,
      isBulletList: ctx.editor.isActive("bulletList") ?? false,
      isOrderedList: ctx.editor.isActive("orderedList") ?? false,
      isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
      isBlockquote: ctx.editor.isActive("blockquote") ?? false,
      canUndo: ctx.editor.can().chain().undo().run() ?? false,
      canRedo: ctx.editor.can().chain().redo().run() ?? false,
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-editor-border bg-muted/30">
      {/* Text formatting */}
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editorState.canBold}
        variant={editorState.isBold ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editorState.canItalic}
        variant={editorState.isItalic ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editorState.canStrike}
        variant={editorState.isStrike ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editorState.canCode}
        variant={editorState.isCode ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Clear marks"
      >
        <RemoveFormatting className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Paragraph & Headings */}
      <Button
        onClick={() => editor.chain().focus().setParagraph().run()}
        variant={editorState.isParagraph ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant={editorState.isHeading1 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editorState.isHeading2 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editorState.isHeading3 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        variant={editorState.isHeading4 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        variant={editorState.isHeading5 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 5"
      >
        <Heading5 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        variant={editorState.isHeading6 ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Heading 6"
      >
        <Heading6 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & Blocks */}
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editorState.isBulletList ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant={editorState.isOrderedList ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        variant={editorState.isCodeBlock ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Code block"
      >
        <Code2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant={editorState.isBlockquote ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Special elements */}
      <Button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().setHardBreak().run()}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Hard break"
      >
        <WrapText className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Undo/Redo */}
      <Button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

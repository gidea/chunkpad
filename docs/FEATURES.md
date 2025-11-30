# Features Documentation

## Overview

Chunkpad provides a comprehensive suite of features for parsing, chunking, editing, and exporting documents for RAG (Retrieval-Augmented Generation) pipelines and AI applications. Available as a cross-platform desktop application (macOS, Windows, Linux) built with Electron, with optional web version support.

---

## 🖥️ Desktop App Features

### Native File System Integration

- **Native File Dialogs**: Open and save files using system-native dialogs
- **File Associations**: Double-click `.docx`, `.pptx`, `.pdf`, or `.chunkpad` files to open
- **Command-Line Support**: Open files from terminal/command prompt
- **"Open With" Integration**: Right-click files to open with Chunkpad
- **Directory Selection**: Choose directories for batch exports

### Project Management

- **Save Projects**: Save entire workspace state as `.chunkpad` project files
- **Load Projects**: Restore complete workspace including:
  - All loaded documents
  - All chunks and their content
  - Global and chunk-level metadata
  - Chunk size and overlap settings
- **Project Persistence**: Track current project file path
- **Auto-save Support**: (Future enhancement)

### Application Menu

- **File Menu**:
  - Open Document (Cmd/Ctrl+Shift+O)
  - Load Project (Cmd/Ctrl+O)
  - Save Project (Cmd/Ctrl+S)
  - Save Project As... (Cmd/Ctrl+Shift+S)
  - Export Selected (Cmd/Ctrl+E)
  - Quit
- **Edit Menu**: Undo, Redo, Cut, Copy, Paste (native OS integration)
- **View Menu**: Toggle Sidebar, Developer Tools, Zoom controls
- **Help Menu**: Keyboard Shortcuts, Documentation, About

### Keyboard Shortcuts

- **File Operations**:
  - `Cmd/Ctrl+Shift+O` - Open Document
  - `Cmd/Ctrl+O` - Load Project
  - `Cmd/Ctrl+S` - Save Project
  - `Cmd/Ctrl+Shift+S` - Save Project As
  - `Cmd/Ctrl+E` - Export Selected
- **View**:
  - `Cmd/Ctrl+B` - Toggle Sidebar
  - `Cmd/Ctrl+?` - Show Keyboard Shortcuts
- **Edit**: Standard OS shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+C, etc.)

### Platform-Specific Features

**macOS**:
- Dock menu with quick actions (New Window, Open Document, Load Project)
- Native title bar integration
- App menu in menu bar
- `open-file` event handling

**Windows**:
- Taskbar integration
- App user model ID for notifications
- NSIS installer support
- Jump lists (future enhancement)

**Linux**:
- AppImage, .deb, .rpm package support
- Desktop file integration
- System tray support (future enhancement)

### Performance & UX

- **Loading Indicators**: Progress bars and messages for all async operations
- **File Size Warnings**: Alerts for files larger than 50MB
- **Error Handling**: Clear, actionable error messages
- **Tooltips**: Helpful tooltips on key UI elements
- **Non-blocking UI**: All file operations are async

---

## 📄 Document Parsing

### Supported File Formats

#### 1. PDF Documents (.pdf)

**Capabilities**:
- ✅ Text extraction from selectable text PDFs
- ✅ Multi-page support (unlimited pages)
- ✅ Paragraph detection based on text positioning
- ✅ Page-by-page organization
- ✅ Preserves text flow and structure

**Limitations**:
- ❌ Scanned PDFs without OCR (image-based text not extracted)
- ❌ Complex multi-column layouts may have ordering issues
- ❌ Embedded images not extracted

**Best For**:
- Research papers
- Technical documentation
- Reports and whitepapers
- Ebooks and articles

#### 2. Microsoft Word Documents (.docx)

**Capabilities**:
- ✅ Complete document structure preservation
- ✅ Heading hierarchy (H1-H6)
- ✅ Formatted text (bold, italic, underline)
- ✅ Lists (bulleted and numbered)
- ✅ Tables (converted to HTML tables)
- ✅ Paragraphs with proper spacing

**Limitations**:
- ❌ Images not extracted
- ❌ Comments and track changes ignored
- ❌ Complex formatting may be simplified

**Best For**:
- Business documents
- Academic papers
- Policy documents
- Structured content

#### 3. PowerPoint Presentations (.pptx)

**Capabilities**:
- ✅ Slide-by-slide extraction
- ✅ Slide title detection
- ✅ Bullet point preservation
- ✅ Speaker notes extraction
- ✅ Text body content
- ✅ Multi-element slides

**Limitations**:
- ❌ Images and charts not extracted
- ❌ Slide layouts not preserved
- ❌ Animations and transitions lost

**Best For**:
- Presentation content
- Training materials
- Lecture notes
- Meeting slides

### File Upload

**Interface**:
- Drag-and-drop file upload
- Click to browse file picker
- Visual feedback during upload
- Error handling for unsupported formats

**Technical Details**:
- Files processed client-side in browser
- No file size limit enforced (browser memory dependent)
- Files never uploaded to server
- Multiple file support (switch between documents)

---

## 🧩 Intelligent Chunking

### Chunking Algorithm

**Core Strategy**: Semantic boundary-aware chunking with token-based sizing

**Process**:
1. Parse document into HTML blocks (paragraphs, headings, sections)
2. Count tokens for each block using tiktoken
3. Combine blocks until target size reached
4. Respect semantic boundaries (don't split mid-paragraph)
5. Add overlap for context preservation
6. Handle oversized blocks by splitting at sentence boundaries

**Configurable Parameters**:

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Target Chunk Size | 1000 tokens | 200-3000 | Target number of tokens per chunk |
| Overlap Size | 150 tokens | 0-500 | Number of tokens to overlap between chunks |

### Token Counting

**Engine**: tiktoken with `cl100k_base` encoding (GPT-3.5/GPT-4 compatible)

**Accuracy**: Matches OpenAI's token counting for:
- GPT-3.5-turbo
- GPT-4
- GPT-4-turbo
- text-embedding-ada-002

**Real-time Display**:
- Token count shown for each chunk
- Total tokens displayed in chunk list
- Live updates as content is edited

### Chunk Optimization

**Automatic Features**:
- **Semantic Boundaries**: Chunks start at heading or paragraph breaks
- **Overlap Strategy**: Last N tokens from previous chunk included in next
- **Sentence Splitting**: Oversized blocks split at sentence endings
- **Title Extraction**: Chunk titles extracted from first heading or auto-generated
- **Preview Generation**: First 100 characters shown as preview

**Quality Controls**:
- Avoid chunks that are too small (handled by target size)
- Prevent mid-sentence breaks
- Maintain HTML structure integrity
- Preserve context through overlap

### Re-chunking

**Dynamic Adjustment**:
- Change chunk size slider → automatic re-chunking
- Change overlap slider → automatic re-chunking
- Preserves manual edits (prompts before re-chunking)
- Maintains metadata assignments

---

## ✏️ Rich Text Editing

### TipTap Editor

**Formatting Tools**:

**Text Formatting**:
- Bold (`Ctrl/Cmd + B`)
- Italic (`Ctrl/Cmd + I`)
- Strikethrough
- Code inline
- Subscript
- Superscript

**Block Elements**:
- Headings (H1-H6)
- Paragraphs
- Blockquotes
- Code blocks
- Horizontal rules

**Lists**:
- Bulleted lists
- Numbered lists
- Nested lists (indent/outdent)

**Advanced**:
- Tables (insert, add/remove rows/columns)
- Links (with URL preview)
- Images (via URL)

### Editor Features

**Real-time Updates**:
- Auto-save on content change
- Live token count updates
- Preview regeneration

**Markdown Compatibility**:
- Editor output is HTML
- Converts to markdown on export
- Supports front matter (YAML metadata)

**Keyboard Shortcuts**:
- Standard text editing shortcuts
- Markdown-style shortcuts (e.g., `**` for bold)
- Table navigation shortcuts

---

## 🏷️ Metadata Management

### Global Metadata

**Definition**: Document-level metadata applied to all chunks

**Access**: Globe icon button in header → Global Metadata dialog

**Use Cases**:
- Document category (`category: "Technical Documentation"`)
- Source information (`source: "Company Wiki"`)
- Author (`author: "John Doe"`)
- Date (`date: "2024-01-15"`)

**Features**:
- Key-value pairs
- Free-form text entry
- Applied to all chunks during export
- Persists per document

### Chunk Metadata

**Definition**: Chunk-specific metadata that overrides global metadata

**Access**: Tag icon in chunk title → Document Metadata dialog

**Use Cases**:
- Topic tagging (`topic: "Authentication"`)
- Section categorization (`section: "Implementation"`)
- Domain areas (`domain-area: "Security"`)

**Features**:
- Inherits global metadata as defaults
- Override specific keys per chunk
- Clear existing metadata option
- Apply to all chunks option

### Bulk Metadata Operations

**Apply to All Chunks**:
1. Set metadata on one chunk
2. Click "Apply to All" button
3. Metadata copied to all chunks in document

**Clear Metadata**:
- Remove chunk-specific metadata
- Falls back to global metadata

### Front Matter Integration

**YAML Front Matter**:
```yaml
---
topic: Introduction
category: Documentation
author: John Doe
---

Chunk content begins here...
```

**Features**:
- Automatically parsed from markdown
- Preserved during editing
- Merged with global metadata on export
- Standard YAML syntax

---

## 📤 Export System

### Export Formats

#### 1. JSON Export

**Structure**:
```json
[
  {
    "id": "chunk-1-1234567890",
    "title": "Chunk 1: Introduction",
    "preview": "First 100 characters of content...",
    "content": "<p>Full HTML content of chunk</p>",
    "tokens": 856,
    "metadata": {
      "topic": "Introduction",
      "category": "Documentation"
    }
  }
]
```

**Use Cases**:
- Import into databases
- API consumption
- Programming workflows
- Vector database ingestion

**Features**:
- Complete chunk data
- All metadata included
- JSON array format
- Pretty-printed (indented)

#### 2. Markdown Export

**Format**:
```markdown
---
topic: Introduction
category: Documentation
---

# Chunk 1: Introduction

Content converted to clean markdown with proper formatting:
- Lists converted
- **Bold** and *italic* preserved
- [Links](https://example.com) maintained
- Code blocks formatted

---

[Next chunk with same format]
```

**Conversion**: HTML → Markdown using Turndown.js

**Use Cases**:
- Documentation websites
- Static site generators (Jekyll, Hugo)
- GitHub repositories
- Markdown-based systems

**Features**:
- Clean markdown syntax
- Front matter with metadata
- ATX-style headings (`#`)
- Fenced code blocks
- Proper list formatting

#### 3. Plain Text Export

**Format**:
```text
Chunk 1: Introduction
======================

Content with HTML tags stripped and whitespace normalized.
Paragraphs are preserved with proper spacing.

Lists and formatting are converted to plain text equivalently.
```

**Conversion**: HTML tags stripped, text extracted

**Use Cases**:
- Text analysis
- Word counting
- Simple text processing
- Non-HTML systems

**Features**:
- No HTML tags
- Normalized whitespace
- Title underlines with `=` characters
- Readable plain text

### Export Modes

#### Single File Mode

**Behavior**:
- All selected chunks combined into one file
- Chunks separated by horizontal rules (`---`)
- Single download

**Filename**: `{document-name}_chunks.{extension}`

**Best For**:
- Small to medium documents
- Sequential reading
- Single-file processing

#### Multiple Files Mode

**Behavior**:
- One file per selected chunk
- Each chunk downloads individually
- Sequential downloads (browser-dependent)

**Filename Pattern**: `{prefix}{separator}{chunk-title}.{extension}`

**Options**:
- **File Prefix**: Optional prefix for all files (e.g., "project")
- **Separator**: Character between prefix and title (default: "_")
- **Preview**: Shows example filename

**Example**: 
- Prefix: `docs`
- Separator: `-`
- Result: `docs-chunk_1_introduction.md`

**Best For**:
- Large documents
- Individual chunk processing
- Organized file systems
- Bulk import to folders

### Chunk Selection

**Interface**:
- Checkbox for each chunk
- "Select All" / "Deselect All" toggle
- Selection counter (`3/10 selected`)
- Visual indication of selected chunks

**Behavior**:
- Export only selected chunks
- Must select at least one chunk
- Selection persists during session
- Clear selection button

---

## 🎨 User Interface Features

### Responsive Layout

**Desktop (≥768px)**:
- Three-pane layout:
  - Sidebar (file uploader + file list)
  - Chunk list (left panel)
  - Editor (right panel)
- Resizable panels (drag to adjust width)

**Mobile (<768px)**:
- Single-pane views
- Collapsible sidebar
- Stack layout
- Touch-optimized controls

### Sidebar

**Components**:
1. **Logo/Branding**: Chunky logo at top
2. **File Uploader**: Drag-and-drop zone
3. **File List**: List of loaded documents

**Collapse/Expand**:
- Toggle button (chevron icon)
- Remembers state
- More screen space when collapsed

### File List

**Display**:
- Document icons (PDF, Word, PowerPoint)
- File names (editable)
- Click to switch between documents
- Highlight active document

**File Name Editing**:
1. Click pencil icon or double-click name
2. Edit inline text field
3. Save with Enter or click checkmark
4. Cancel with Escape or X button

### Chunk List

**Display per Chunk**:
- Drag handle (grip icon)
- Chunk title (editable inline)
- Token count badge
- Content preview (first 100 chars)
- Metadata indicator (tag icon if metadata exists)

**Interactions**:
- Click to select chunk → loads in editor
- Drag to reorder chunks
- Edit title inline
- Delete chunk (trash icon)

**Drag-and-Drop Reordering**:
- Grab drag handle
- Drag up or down
- Visual feedback during drag
- Drop to reorder
- Smooth animations

### Editor Panel

**Header**:
- Chunk title (editable)
- Settings button (chunk size configuration)
- Metadata button (document metadata)
- Global metadata button
- Export button

**Toolbar** (MenuBar):
- Text formatting buttons
- Heading level dropdown
- List controls
- Table insertion
- Link management
- Code block toggle

**Editor Area**:
- Full-height text editor
- Syntax highlighting
- Live preview of formatting
- Scroll sync

---

## ⚙️ Settings & Configuration

### Chunk Size Settings

**Access**: Settings icon button in header

**Controls**:

1. **Target Chunk Size**:
   - Slider: 200-3000 tokens
   - Default: 1000 tokens
   - Step: 50 tokens
   - Real-time preview of current value

2. **Overlap Size**:
   - Slider: 0-500 tokens
   - Default: 150 tokens
   - Step: 10 tokens
   - Real-time preview of current value

**Apply Changes**:
- Changes apply immediately
- Re-chunks entire document
- Confirms before discarding manual edits
- Updates all chunks

### Visual Theme

**Current**: Light mode with accent colors

**Customizable** (via CSS variables):
- Primary colors
- Background colors
- Text colors
- Border colors
- Shadow styles

**Future Enhancement**: Dark mode toggle

---

## 🔧 Chunk Operations

### Add New Chunk

**Button**: "+ Add Chunk" button at top of chunk list

**Behavior**:
1. Creates empty chunk
2. Adds to end of chunk list
3. Auto-selects new chunk
4. Opens in editor for editing

**Use Cases**:
- Add introduction/conclusion
- Insert custom sections
- Manual content creation

### Delete Chunk

**Button**: Trash icon in chunk title area

**Behavior**:
- Deletes chunk permanently
- No undo (use browser back if needed)
- Updates chunk numbering
- Selects adjacent chunk

**Confirmation**: No confirmation dialog (instant delete)

### Edit Chunk Title

**Method 1**: Click title text → type new title

**Method 2**: Edit in editor (title bar)

**Validation**: No restrictions (free text)

**Auto-save**: Changes saved immediately

### Reorder Chunks

**Method**: Drag and drop with grip handle

**Visual Feedback**:
- Chunk becomes semi-transparent while dragging
- Drop zone highlighted
- Smooth animation on drop

**Persistence**: New order maintained until re-chunking

---

## 🚀 Performance Features

### Client-Side Processing

**Benefits**:
- ⚡ Instant processing (no server round-trip)
- 🔒 Privacy (files never leave device)
- 💰 No server costs
- 🌐 Works offline

**Limitations**:
- Browser memory constraints
- Single-threaded processing (UI may block on large files)

### Optimization Strategies

**Current**:
- React component memoization
- Efficient state updates
- Optimized parsing algorithms

**Future Enhancements**:
- Web Workers for background parsing
- Virtual scrolling for 100+ chunks
- Incremental parsing for large files

---

## 🔐 Security & Privacy

### Data Privacy

**Client-Side Only**:
- All processing in browser
- No data sent to servers
- No data storage (ephemeral)
- Safe for sensitive documents

**No Tracking**:
- No analytics by default
- No cookies
- No external requests (except library CDNs)

### Browser Security

**Secure APIs**:
- File API (sandboxed file access)
- ArrayBuffer (memory-safe binary handling)
- DOMParser (XSS-safe XML parsing)

**No Vulnerabilities**:
- No user-generated code execution
- No SQL injection risk (no database)
- No XSS risk (React escapes by default)

---

## 🎯 Use Case Examples

### 1. RAG Pipeline Preparation

**Scenario**: Prepare technical documentation for AI chatbot

**Workflow**:
1. Upload PDF documentation
2. Set chunk size to 800 tokens (optimal for embeddings)
3. Add metadata: `category: "API Docs"`, `source: "v2.0"`
4. Export as JSON
5. Import JSON into vector database (Pinecone, Weaviate, etc.)

### 2. Knowledge Base Creation

**Scenario**: Create searchable knowledge base from Word docs

**Workflow**:
1. Upload multiple DOCX files
2. Chunk each with consistent settings
3. Add global metadata per document (author, date, category)
4. Export as Markdown (multiple files)
5. Deploy to static site generator

### 3. Research Paper Analysis

**Scenario**: Extract sections from academic papers

**Workflow**:
1. Upload PDF research papers
2. Chunk by natural sections (auto-detected by headings)
3. Add chunk metadata: `section: "Methods"`, `topic: "Experiment 1"`
4. Export selected chunks as plain text for analysis

### 4. Training Data Preparation

**Scenario**: Prepare documents for fine-tuning LLM

**Workflow**:
1. Upload various document types
2. Standardize chunk size (1000 tokens)
3. Add consistent metadata schema
4. Export as JSONL (one chunk per line)
5. Use for model training

---

## 📋 Tips & Best Practices

### Optimal Chunk Sizes

**General Purpose**: 800-1200 tokens
**Embeddings**: 500-1000 tokens (vector DB limits)
**Summarization**: 1500-2000 tokens (more context)
**Q&A**: 300-600 tokens (focused answers)

### Metadata Strategy

**Consistent Schema**: Use same keys across documents
```yaml
category: "Documentation"
subcategory: "User Guide"
topic: "Authentication"
version: "2.0"
```

**Hierarchical**: Use dot notation or nested structure
```yaml
product.name: "API Platform"
product.version: "2.0"
document.type: "Tutorial"
```

### Overlap Guidelines

**Low Overlap (50-100 tokens)**: Independent chunks, faster processing
**Medium Overlap (150-200 tokens)**: Balanced context preservation
**High Overlap (250-500 tokens)**: Maximum context, larger index

### File Preparation

**Before Upload**:
- Ensure PDFs have selectable text (run OCR if needed)
- Clean up DOCX formatting (remove extra spacing)
- Simplify PPTX (remove unnecessary slides)

---

## 🐛 Known Limitations

### Document Parsing

1. **Scanned PDFs**: No OCR support (text must be selectable)
2. **Complex Tables**: May lose structure in conversion
3. **Images**: Not extracted or processed
4. **Footnotes**: May be placed out of order
5. **Multi-column**: May have text flow issues

### Chunking

1. **Very Large Chunks**: Single paragraphs >3000 tokens not split further
2. **Language Support**: Token counting optimized for English
3. **Code Blocks**: May be split mid-block if oversized

### Export

1. **Batch Downloads**: Browser may limit concurrent downloads
2. **Large Exports**: May hit browser memory limits (100MB+)
3. **File Naming**: Special characters sanitized in filenames

---

## 🔮 Future Feature Roadmap

### Planned Enhancements

**Phase 1** (Next Release):
- ✨ Dark mode toggle
- 📊 Analytics dashboard (token distribution charts)
- 🔍 Search within chunks
- 📎 Chunk merging/splitting controls

**Phase 2** (Future):
- 🤖 AI-powered chunk summarization
- 🏷️ Automatic keyword extraction
- 🔗 Cross-chunk reference detection
- 💾 LocalStorage persistence

**Phase 3** (Advanced):
- 🌐 Multi-language support
- 🖼️ Image extraction and OCR
- 📊 Table structure preservation
- 🔌 Direct vector DB integration

---

---

## 🆚 Desktop vs Web Version

### Desktop App Advantages

- ✅ Native file dialogs (better UX)
- ✅ File associations (double-click to open)
- ✅ Project save/load (persistent workspace)
- ✅ Command-line file opening
- ✅ Native menu bar integration
- ✅ Platform-specific features (dock menu, taskbar)
- ✅ Better performance for large files
- ✅ Offline-first (no internet required)

### Web Version Advantages

- ✅ No installation required
- ✅ Accessible from any device
- ✅ Easy sharing via URL
- ✅ Automatic updates
- ✅ Cross-platform (any OS with browser)

### Shared Features

Both versions share the same core functionality:
- Document parsing (PDF, DOCX, PPTX)
- Intelligent chunking
- Rich text editing
- Metadata management
- Export formats (JSON, Markdown, Plain Text)
- All UI features and settings

---

This comprehensive feature set makes Chunkpad a powerful tool for anyone working with AI systems, knowledge bases, or document processing workflows.

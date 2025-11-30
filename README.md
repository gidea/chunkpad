# Chunkpad

A desktop application for parsing documents (PDF, DOCX, PPTX), chunking them into RAG-optimized segments, and exporting them in multiple formats. Built with Electron for cross-platform support.

## Features

### Document Processing
- **Multi-format Support**: Parse PDF, DOCX, and PPTX files
- **Intelligent Parsing**: Preserves document structure, headings, and metadata
- **Page/Slide Tracking**: Maintains page numbers (PDF) and slide numbers (PPTX) in chunk metadata

### Chunking Strategies
- **Fixed Size**: Token-based chunking with configurable size and overlap (default)
- **Heading-Aware**: Groups content under headings, preserving document hierarchy
- **Paragraph-Aware**: Recursive splitting (paragraph → sentence → token) maintaining paragraph coherence
- **Sliding Window**: Overlapping chunks with configurable windows for maximum context preservation
- **Per-File Configuration**: Each document can use its own chunking strategy and settings

### Editing & Management
- **Rich Text Editor**: TipTap-powered markdown editor with formatting tools
- **Metadata Management**: Document-level and chunk-level metadata with YAML front matter
- **Drag-and-Drop**: Reorder chunks with intuitive interface
- **Real-time Token Counting**: Live token counts for each chunk

### Export Options
- **Multiple Formats**: JSON, Markdown, or Plain Text
- **Export Modes**: Single combined file or multiple individual files
- **Clean Markdown**: HTML-to-Markdown conversion with proper formatting
- **RAG-Ready**: Includes strategy metadata, section paths, and source information

### Desktop Features
- **Native File Dialogs**: System file pickers for opening and saving
- **File Associations**: Double-click `.docx`, `.pptx`, `.pdf`, or `.chunkpad` files to open
- **Project Persistence**: Save and load entire workspace state
- **Keyboard Shortcuts**: Full keyboard support (see Help menu)

## Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn**

### Local Development

1. **Clone and install**
   ```bash
   git clone <YOUR_GIT_URL>
   cd chunkpad
   npm install
   ```

2. **Run Electron app**
   ```bash
   npm run electron:dev
   ```

3. **Build for production**
   ```bash
   npm run electron:dist
   ```
   Distributables will be in the `release/` directory.

### Web Version (Optional)

```bash
npm run dev
```
Navigate to `http://localhost:8080` (or the port shown in terminal).

## Usage

1. **Load Documents**: Open PDF, DOCX, or PPTX files via File menu or drag-and-drop
2. **Configure Chunking**: Use the toolbar below the document title to select a chunking strategy and adjust settings
3. **Edit Chunks**: Click on chunks to edit content, titles, and metadata
4. **Export**: Use the Export button to save chunks in your preferred format

### Chunking Strategies Guide

- **Fixed Size**: Best for general purpose, unstructured documents
- **Heading-Aware**: Best for structured documents with clear headings (manuals, reports, technical docs)
- **Paragraph-Aware**: Best for narrative content (blog posts, articles, stories)
- **Sliding Window**: Best for technical documents where context spanning boundaries is critical

See [docs/user-chunking-modes.md](./docs/user-chunking-modes.md) for detailed strategy documentation.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron
- **Build**: Vite
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS
- **Editor**: TipTap (ProseMirror)
- **Parsing**: pdfjs-dist, mammoth, jszip
- **Token Counting**: tiktoken
- **Markdown**: Turndown

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture and design
- **[Chunking Architecture](./docs/chunking-architecture.md)** - Multi-strategy chunking system
- **[User Guide](./docs/user-chunking-modes.md)** - Chunking strategies guide
- **[Technical Review](./docs/TECHNICAL_REVIEW.md)** - Implementation review

## Troubleshooting

### PDF Parsing Issues
- Ensure PDF contains selectable text (not scanned images)
- Check DevTools console for errors (View > Toggle Developer Tools)

### Large Files
- Files over 50MB will show a warning
- Processing may take 30-60 seconds for large documents
- Progress indicators show during processing

### Build Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear caches
rm -rf .vite dist dist-electron
npm run electron:dev
```

## License

Open source and available for use and modification.

---

Built with ❤️ using [Lovable](https://lovable.dev)

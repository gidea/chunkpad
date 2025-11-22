# Chunkpad

A powerful desktop application for parsing documents (PDF, DOCX, PPTX), chunking them into RAG-optimized segments, and exporting them in multiple formats with clean markdown conversion. Built with Electron for cross-platform desktop support.

## 🎯 Overview

Chunkpad is designed to prepare documents for Retrieval-Augmented Generation (RAG) pipelines and AI applications. It intelligently splits documents into semantically meaningful chunks while preserving context through overlap, and exports them as clean markdown, JSON, or plain text.

**Available as**: Desktop app (Electron) for macOS, Windows, and Linux

## ✨ Key Features

- **Multi-format Support**: Parse PDF, DOCX, and PPTX files
- **Intelligent Chunking**: Semantic chunking with token-aware splitting
- **Rich Editing**: TipTap-powered markdown editor with formatting tools
- **Metadata Management**: Document-level and chunk-level metadata with YAML front matter
- **Clean Exports**: HTML-to-Markdown conversion using Turndown for professional output
- **Flexible Export Options**: Single or multiple files in JSON, Markdown, or Plain Text
- **Drag-and-Drop**: Reorder chunks with intuitive drag-and-drop interface
- **Real-time Preview**: Live token counting and content preview

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager

### Local Development

#### Web Version

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd chunklist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080` (or the port shown in your terminal)

#### Desktop App (Electron)

1. **Install dependencies** (same as above)
   ```bash
   npm install
   ```

2. **Run Electron app in development**
   ```bash
   npm run electron:dev
   ```

   This will:
   - Start the Vite dev server
   - Launch the Electron window
   - Enable hot reload for both React and Electron code

3. **Build for production**
   ```bash
   # Build the app
   npm run electron:build
   
   # Create distributables
   npm run electron:dist
   ```

   Distributables will be in the `release/` directory:
   - **macOS**: `.dmg` and `.zip` files
   - **Windows**: `.exe` installer and `.zip` files
   - **Linux**: `.AppImage`, `.deb`, and `.rpm` packages

### Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build locally
npm run preview
```

## 📦 Building & Distribution

### Desktop App Distribution

#### Build for All Platforms

```bash
# Build for current platform
npm run electron:dist

# Build for specific platform (requires running on that platform or using CI)
# macOS
npm run electron:dist -- --mac

# Windows
npm run electron:dist -- --win

# Linux
npm run electron:dist -- --linux
```

#### Build Configuration

The app is configured in `package.json` under the `build` section:
- **App ID**: `com.chunkpad.app`
- **File Associations**: `.docx`, `.pptx`, `.pdf`, `.chunkpad`
- **Output**: `release/` directory

### Web Deployment (Optional)

The web version can still be deployed to static hosting:

- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag-and-drop the `dist` folder or connect via Git
- **GitHub Pages**: Use `gh-pages` package to deploy the `dist` folder
- **AWS S3 + CloudFront**: Upload `dist` folder to S3 bucket

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Desktop Framework**: Electron
- **Build Tool**: Vite + vite-plugin-electron
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Editor**: TipTap (ProseMirror-based)
- **Drag & Drop**: dnd-kit
- **Document Parsing**:
  - `pdfjs-dist` - PDF parsing with text extraction
  - `mammoth` - DOCX to HTML conversion
  - `jszip` - PPTX parsing and XML extraction
- **Markdown Conversion**: Turndown
- **Token Counting**: tiktoken
- **Routing**: React Router DOM
- **Packaging**: electron-builder

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and system design
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature documentation
- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Original project planning document
- **[ELECTRON_MIGRATION_PLAN.md](./ELECTRON_MIGRATION_PLAN.md)** - Electron migration plan and implementation details

## 🎨 Key Technologies Explained

### Document Parsing

- **PDF**: Uses PDF.js to extract text with paragraph detection based on text positioning
- **DOCX**: Mammoth.js converts to semantic HTML preserving document structure
- **PPTX**: JSZip extracts XML content from OpenXML format, parsing slides and text

### Chunking Engine

Smart chunking algorithm that:
- Respects HTML block boundaries (paragraphs, headings, sections)
- Counts tokens using tiktoken (GPT-3.5-turbo encoding)
- Maintains configurable overlap for context preservation
- Splits oversized blocks at sentence boundaries
- Generates descriptive titles and previews

### Export System

- **HTML to Markdown**: Turndown library converts HTML to clean markdown
- **Plain Text**: Custom HTML tag stripper for readable plain text
- **Front Matter**: YAML metadata block for document and chunk metadata
- **Batch Export**: Single combined file or multiple individual files

## 🔧 Configuration

### Chunk Settings

Default chunking parameters can be adjusted in the UI:

- **Target Chunk Size**: 1000 tokens (adjustable 200-3000)
- **Overlap Size**: 150 tokens (adjustable 0-500)

### Desktop App Features

- **Native File Dialogs**: Open and save files using system dialogs
- **File Associations**: Double-click `.docx`, `.pptx`, `.pdf`, or `.chunkpad` files to open
- **Project Persistence**: Save and load entire workspace state
- **Keyboard Shortcuts**: Full keyboard support (see Help menu)
- **Menu Bar**: Native application menu on all platforms

### Environment Variables

No environment variables required for basic usage. All processing happens client-side.

## 🤝 Contributing

This project is built with [Lovable](https://lovable.dev), an AI-powered development platform.

### Development Workflow

1. **Via Lovable**: Visit the project URL and use AI prompts to make changes
2. **Via IDE**: Clone the repo, make changes, and push - changes sync to Lovable
3. **Via GitHub**: Edit files directly in GitHub interface

All changes are automatically synced between Lovable and GitHub.

## 📄 License

This project is open source and available for use and modification.

## 🐛 Troubleshooting

### PDF Parsing Issues

If PDFs fail to parse:
- Ensure the PDF contains selectable text (not scanned images)
- Check DevTools console for specific errors (View > Toggle Developer Tools)
- Try re-saving the PDF from Adobe Acrobat

### Large File Handling

For documents over 50 pages:
- Parsing may take 30-60 seconds
- Progress indicators will show during processing
- Files over 50MB will show a warning
- Consider splitting very large documents

### Electron Build Issues

If you encounter build errors:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite dist dist-electron

# Rebuild
npm run electron:dev
```

### File Association Issues

If double-clicking files doesn't work:
- **macOS**: Right-click file > Open With > Chunkpad > Always Open With
- **Windows**: Right-click file > Open With > Choose another app > Select Chunkpad > Always use this app
- **Linux**: May require manual desktop file configuration

### Performance Issues

- Large documents (100+ pages) may take time to process
- Use loading indicators to track progress
- Consider processing documents in smaller batches

## 📞 Support

- **Documentation**: [Lovable Docs](https://docs.lovable.dev/)
- **Community**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

## 🎯 Use Cases

- **RAG Pipeline Preparation**: Prepare documents for vector databases
- **AI Training Data**: Structure documents for fine-tuning
- **Content Management**: Organize and chunk large documents
- **Knowledge Base Creation**: Build searchable document collections
- **API Documentation**: Process and structure technical docs
- **Research Papers**: Chunk academic papers for semantic search

---

Built with ❤️ using [Lovable](https://lovable.dev)

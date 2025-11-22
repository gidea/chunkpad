#!/bin/bash
# Fix node_modules and other large files in git

set -e

echo "=== Fix Large Files in Git ==="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Step 1: Check what's tracked
echo "=== Step 1: Check Tracked Files ==="
echo ""

NODE_MODULES_COUNT=$(git ls-files | grep -c "^node_modules/" || echo "0")
DIST_COUNT=$(git ls-files | grep -c "^dist/" || echo "0")
RELEASE_COUNT=$(git ls-files | grep -c "^release/" || echo "0")
DIST_ELECTRON_COUNT=$(git ls-files | grep -c "^dist-electron/" || echo "0")

echo "Currently tracked:"
echo "  - node_modules/: $NODE_MODULES_COUNT files"
echo "  - dist/: $DIST_COUNT files"
echo "  - release/: $RELEASE_COUNT files"
echo "  - dist-electron/: $DIST_ELECTRON_COUNT files"
echo ""

# Step 2: Ensure .gitignore is correct
echo "=== Step 2: Verify .gitignore ==="
echo ""

cat > .gitignore << 'EOF'
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies
node_modules/

# Build outputs
dist
dist-ssr
dist-electron
*.local

# Electron build artifacts (should not be committed)
release/
*.dmg
*.zip
*.AppImage
*.deb
*.rpm
*.exe
*.blockmap

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
EOF

echo "✅ .gitignore updated"
echo ""

# Step 3: Remove large files from tracking
echo "=== Step 3: Remove Large Files from Tracking ==="
echo ""

if [ "$NODE_MODULES_COUNT" -gt 0 ]; then
    echo "Removing node_modules/ from git tracking..."
    git rm -r --cached node_modules/ 2>/dev/null || true
    echo "✅ Removed node_modules/"
fi

if [ "$DIST_COUNT" -gt 0 ]; then
    echo "Removing dist/ from git tracking..."
    git rm -r --cached dist/ 2>/dev/null || true
    echo "✅ Removed dist/"
fi

if [ "$RELEASE_COUNT" -gt 0 ]; then
    echo "Removing release/ from git tracking..."
    git rm -r --cached release/ 2>/dev/null || true
    echo "✅ Removed release/"
fi

if [ "$DIST_ELECTRON_COUNT" -gt 0 ]; then
    echo "Removing dist-electron/ from git tracking..."
    git rm -r --cached dist-electron/ 2>/dev/null || true
    echo "✅ Removed dist-electron/"
fi

echo ""

# Step 4: Stage .gitignore
echo "=== Step 4: Stage Changes ==="
echo ""

git add .gitignore
echo "✅ Staged .gitignore"
echo ""

# Step 5: Show what will be committed
echo "=== Step 5: Changes to Commit ==="
echo ""

if ! git diff --cached --quiet; then
    echo "Files to be removed from tracking:"
    git diff --cached --name-only | head -20
    echo "..."
    echo ""
    
    echo "Committing changes..."
    git commit -m "Remove node_modules and build artifacts from git tracking

- Remove node_modules/ (should never be committed)
- Remove dist/, dist-electron/, release/ (build artifacts)
- Update .gitignore to prevent future commits" || {
        echo "⚠️  No changes to commit"
    }
    echo "✅ Changes committed"
else
    echo "✅ No changes to commit (files already removed)"
fi

echo ""

# Step 6: Show repository size
echo "=== Step 6: Repository Size ==="
echo ""

echo "Current repository size:"
git count-objects -vH
echo ""

echo "⚠️  Note: Large files are still in git history!"
echo "The .git folder is still large because of historical commits."
echo ""
echo "To completely fix this, you need to:"
echo "1. Create an orphan branch (no history): bash create-orphan-branch.sh"
echo "2. Or clean git history: git filter-repo --strip-blobs-bigger-than 10M"
echo ""

echo "=== Complete ==="


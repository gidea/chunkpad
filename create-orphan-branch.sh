#!/bin/bash
# Create a completely new branch with no history (orphan branch)

set -e

echo "=== Create Orphan Branch (No History) ==="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

REMOTE=$(git remote | head -1)
if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote repository found"
    exit 1
fi

# Step 1: Save current work
echo "=== Step 1: Save Current Work ==="
echo ""

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Step 2: Create orphan branch
echo "=== Step 2: Create Orphan Branch ==="
echo ""

NEW_BRANCH="desktop-app"
echo "Creating orphan branch: $NEW_BRANCH"

# Delete branch if it exists
if git show-ref --verify --quiet refs/heads/$NEW_BRANCH; then
    git branch -D "$NEW_BRANCH" 2>&1 || true
fi

# Create orphan branch
git checkout --orphan "$NEW_BRANCH"
echo "✅ Created orphan branch: $NEW_BRANCH"
echo ""

# Step 3: Remove all files from staging
echo "=== Step 3: Prepare Clean State ==="
echo ""

git rm -rf --cached . 2>/dev/null || true
echo "✅ Cleared staging area"
echo ""

# Step 4: Ensure .gitignore is correct
echo "=== Step 4: Setup .gitignore ==="
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
dist/
dist-ssr/
dist-electron/
*.local

# Electron build artifacts (should not be committed)
release/
dist-electron/
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

echo "✅ .gitignore created"
echo ""

# Step 5: Add only source files
echo "=== Step 5: Add Source Files ==="
echo ""

# Add all files except those in .gitignore
git add -A
echo "✅ Files staged"
echo ""

# Step 6: Check what will be committed
echo "=== Step 6: Files to Commit ==="
echo ""

echo "Files to be committed:"
git ls-files --cached | head -20
echo "..."
echo ""

# Check for large files
echo "Checking for large files (>10MB):"
git ls-files --cached | xargs -I {} sh -c 'if [ -f {} ]; then size=$(du -h {} | cut -f1); if [ $(du -m {} | cut -f1) -gt 10 ]; then echo "$size - {}"; fi; fi' | head -10
echo ""

# Step 7: Commit
echo "=== Step 7: Initial Commit ==="
echo ""

git commit -m "Initial commit: Desktop app migration

- Electron integration
- Native file system support
- Project save/load functionality
- Application menu and keyboard shortcuts
- Platform-specific features" || {
    echo "⚠️  No files to commit (all ignored?)"
    exit 1
}

echo "✅ Initial commit created"
echo ""

# Step 8: Show repository size
echo "=== Step 8: Repository Size ==="
echo ""

echo "Repository size:"
git count-objects -vH
echo ""

# Step 9: Push
echo "=== Step 9: Push to Remote ==="
echo ""

echo "Pushing orphan branch to $REMOTE/$NEW_BRANCH..."
if git push -u "$REMOTE" "$NEW_BRANCH" --force 2>&1; then
    echo ""
    echo "✅ Successfully pushed clean branch!"
    echo ""
    echo "This branch has NO history - it's completely fresh."
    echo "All large files are excluded via .gitignore."
else
    echo ""
    echo "⚠️  Push failed. Check the error above."
fi

echo ""
echo "=== Complete ==="


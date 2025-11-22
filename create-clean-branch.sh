#!/bin/bash
# Script to delete build folders and create a clean new branch

set -e

echo "=== Create Clean Branch ==="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Step 1: Delete build folders
echo "=== Step 1: Delete Build Folders ==="
echo ""

echo "Deleting build artifacts..."
rm -rf dist/ dist-electron/ release/ 2>/dev/null || true
echo "✅ Deleted: dist/, dist-electron/, release/"
echo ""

# Step 2: Ensure .gitignore is correct
echo "=== Step 2: Verify .gitignore ==="
echo ""

if ! grep -q "^release/" .gitignore 2>/dev/null; then
    echo "Updating .gitignore..."
    cat >> .gitignore << 'EOF'

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
EOF
    echo "✅ .gitignore updated"
else
    echo "✅ .gitignore already includes build artifacts"
fi

echo ""

# Step 3: Commit any changes
echo "=== Step 3: Commit Changes ==="
echo ""

git add .gitignore 2>/dev/null || true

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Committing changes..."
    git add -A
    git commit -m "Clean up: remove build artifacts and update .gitignore" || {
        echo "⚠️  No changes to commit"
    }
else
    echo "✅ No changes to commit"
fi

echo ""

# Step 4: Create new clean branch
echo "=== Step 4: Create New Clean Branch ==="
echo ""

NEW_BRANCH="desktop-app-clean"
echo "Creating new branch: $NEW_BRANCH"

# Check if branch already exists
if git show-ref --verify --quiet refs/heads/$NEW_BRANCH; then
    echo "Branch $NEW_BRANCH already exists. Switching to it..."
    git checkout $NEW_BRANCH
    echo "✅ Switched to $NEW_BRANCH"
else
    # Create new branch from current state
    git checkout -b $NEW_BRANCH
    echo "✅ Created and switched to $NEW_BRANCH"
fi

echo ""

# Step 5: Show status
echo "=== Step 5: Current Status ==="
echo ""

echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "Repository size:"
git count-objects -vH
echo ""

# Step 6: Show what will be pushed
echo "=== Step 6: Files to Push ==="
echo ""

echo "Tracked files (excluding build artifacts):"
git ls-files | grep -v "^dist/" | grep -v "^dist-electron/" | grep -v "^release/" | head -20
echo "..."
echo ""

# Step 7: Push option
echo "=== Step 7: Push to Remote ==="
echo ""

REMOTE=$(git remote | head -1)
if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote repository found"
    echo "Add a remote with: git remote add origin <your-repo-url>"
    exit 0
fi

echo "Remote: $REMOTE"
echo "Branch: $NEW_BRANCH"
echo ""
echo "To push this clean branch, run:"
echo "  git push -u $REMOTE $NEW_BRANCH"
echo ""

# Ask if user wants to push now
read -p "Push to remote now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to $REMOTE/$NEW_BRANCH..."
    if git push -u "$REMOTE" "$NEW_BRANCH"; then
        echo ""
        echo "✅ Successfully pushed clean branch!"
        echo ""
        echo "You can now:"
        echo "1. Delete the old branch: git branch -D desktop-app"
        echo "2. Set this as your main branch on GitHub"
    else
        echo ""
        echo "⚠️  Push failed. Check authentication and try again."
    fi
else
    echo "Skipping push. Run manually when ready:"
    echo "  git push -u $REMOTE $NEW_BRANCH"
fi

echo ""
echo "=== Complete ==="
echo ""
echo "Clean branch created: $NEW_BRANCH"
echo "Build folders deleted: dist/, dist-electron/, release/"
echo ""


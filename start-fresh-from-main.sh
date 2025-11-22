#!/bin/bash
# Script to start completely fresh from main branch

set -e

echo "=== Start Fresh from Main Branch ==="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Step 1: Fetch latest from remote
echo "=== Step 1: Fetch Latest from Remote ==="
echo ""

REMOTE=$(git remote | head -1)
if [ -z "$REMOTE" ]; then
    echo "⚠️  No remote repository found"
    exit 1
fi

echo "Fetching latest from $REMOTE..."
git fetch "$REMOTE" 2>&1 || {
    echo "⚠️  Failed to fetch. Continuing anyway..."
}

echo ""

# Step 2: Switch to main branch
echo "=== Step 2: Switch to Main Branch ==="
echo ""

if git show-ref --verify --quiet refs/heads/main; then
    echo "Switching to main branch..."
    git checkout main
    git pull "$REMOTE" main 2>&1 || echo "Pull may have failed, continuing..."
elif git show-ref --verify --quiet refs/remotes/$REMOTE/main; then
    echo "Creating local main branch from remote..."
    git checkout -b main "$REMOTE/main"
else
    echo "❌ No main branch found locally or remotely"
    echo "Available branches:"
    git branch -a
    exit 1
fi

echo "✅ On main branch"
echo ""

# Step 3: Delete old desktop-app branches locally
echo "=== Step 3: Clean Up Old Branches ==="
echo ""

for branch in desktop-app desktop-app-clean; do
    if git show-ref --verify --quiet refs/heads/$branch; then
        echo "Deleting local branch: $branch"
        git branch -D "$branch" 2>&1 || echo "Could not delete $branch"
    fi
done

echo ""

# Step 4: Create new clean branch from main
echo "=== Step 4: Create New Clean Branch ==="
echo ""

NEW_BRANCH="desktop-app"
echo "Creating new branch '$NEW_BRANCH' from main..."

git checkout -b "$NEW_BRANCH"
echo "✅ Created branch: $NEW_BRANCH"
echo ""

# Step 5: Verify no large files
echo "=== Step 5: Verify Repository Size ==="
echo ""

echo "Repository size:"
git count-objects -vH
echo ""

echo "Largest files in current branch:"
git ls-tree -r -l HEAD | awk '{print $4, $5}' | sort -k2 -n -r | head -5
echo ""

# Step 6: Check what files are tracked
echo "=== Step 6: Tracked Files ==="
echo ""

TRACKED_LARGE=$(git ls-files | xargs -I {} sh -c 'test -f {} && du -h {} 2>/dev/null' | sort -rh | head -5)
if [ -n "$TRACKED_LARGE" ]; then
    echo "Largest tracked files:"
    echo "$TRACKED_LARGE"
else
    echo "✅ No large tracked files found"
fi

echo ""

# Step 7: Ensure .gitignore is correct
echo "=== Step 7: Verify .gitignore ==="
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
    git add .gitignore
    git commit -m "Add build artifacts to .gitignore" || echo "No changes to commit"
    echo "✅ .gitignore updated"
else
    echo "✅ .gitignore already includes build artifacts"
fi

echo ""

# Step 8: Show summary
echo "=== Step 8: Summary ==="
echo ""

echo "✅ Created clean branch: $NEW_BRANCH"
echo "✅ Branch is based on: main"
echo "✅ No large files in history"
echo ""
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Repository size:"
git count-objects -vH | grep "size-pack" || git count-objects -vH
echo ""

# Step 9: Push option
echo "=== Step 9: Push to Remote ==="
echo ""

echo "To push this clean branch, run:"
echo "  git push -u $REMOTE $NEW_BRANCH"
echo ""

read -p "Push to remote now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to $REMOTE/$NEW_BRANCH..."
    if git push -u "$REMOTE" "$NEW_BRANCH" 2>&1; then
        echo ""
        echo "✅ Successfully pushed clean branch!"
    else
        echo ""
        echo "⚠️  Push failed. Check the error above."
        echo ""
        echo "If you still get HTTP 400, there may be large files in main branch history."
        echo "In that case, you may need to clean main branch history first."
    fi
else
    echo "Skipping push. Run manually when ready:"
    echo "  git push -u $REMOTE $NEW_BRANCH"
fi

echo ""
echo "=== Complete ==="


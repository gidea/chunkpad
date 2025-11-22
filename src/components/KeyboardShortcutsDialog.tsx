import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const CmdOrCtrl = isMac ? '⌘' : 'Ctrl';
const Alt = isMac ? '⌥' : 'Alt';
const Shift = isMac ? '⇧' : 'Shift';

export const KeyboardShortcutsDialog = ({ open, onOpenChange }: KeyboardShortcutsDialogProps) => {
  const shortcuts = [
    {
      category: 'File Operations',
      items: [
        { keys: [`${CmdOrCtrl}`, 'O'], description: 'Load project' },
        { keys: [`${CmdOrCtrl}`, 'S'], description: 'Save project' },
        { keys: [`${Shift}`, `${CmdOrCtrl}`, 'S'], description: 'Save project as...' },
        { keys: [`${Shift}`, `${CmdOrCtrl}`, 'O'], description: 'Open document' },
        { keys: [`${CmdOrCtrl}`, 'E'], description: 'Export selected chunks' },
        { keys: isMac ? ['⌘', 'Q'] : ['Alt', 'F4'], description: 'Quit application' },
      ],
    },
    {
      category: 'Editing',
      items: [
        { keys: [`${CmdOrCtrl}`, 'Z'], description: 'Undo' },
        { keys: [`${Shift}`, `${CmdOrCtrl}`, 'Z'], description: 'Redo' },
        { keys: [`${CmdOrCtrl}`, 'X'], description: 'Cut' },
        { keys: [`${CmdOrCtrl}`, 'C'], description: 'Copy' },
        { keys: [`${CmdOrCtrl}`, 'V'], description: 'Paste' },
        { keys: [`${CmdOrCtrl}`, 'B'], description: 'Bold (in editor)' },
        { keys: [`${CmdOrCtrl}`, 'I'], description: 'Italic (in editor)' },
      ],
    },
    {
      category: 'View',
      items: [
        { keys: [`${CmdOrCtrl}`, 'B'], description: 'Toggle sidebar' },
        { keys: isMac ? [`${Alt}`, '⌘', 'I'] : [`${CmdOrCtrl}`, `${Shift}`, 'I'], description: 'Toggle developer tools' },
        { keys: [`${CmdOrCtrl}`, '='], description: 'Zoom in' },
        { keys: [`${CmdOrCtrl}`, '-'], description: 'Zoom out' },
        { keys: [`${CmdOrCtrl}`, '0'], description: 'Reset zoom' },
      ],
    },
    {
      category: 'Help',
      items: [
        { keys: [`${CmdOrCtrl}`, '?'], description: 'Show keyboard shortcuts' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Keyboard shortcuts for Chunkpad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-2">
              <Label className="text-sm font-semibold">{category.category}</Label>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>Note: Editor shortcuts (bold, italic, etc.) work when the editor is focused.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};


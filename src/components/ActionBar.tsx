import { motion } from 'motion/react';
import { Scissors, Copy, Clipboard, Edit3, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';

interface ActionBarProps {
  selectedCount: number;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCancel: () => void;
  canRename: boolean;
  canPaste: boolean;
}

export function ActionBar({
  selectedCount,
  onCut,
  onCopy,
  onPaste,
  onRename,
  onDelete,
  onCancel,
  canRename,
  canPaste
}: ActionBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-purple-100 p-4 shadow-lg z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 hover:bg-purple-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCut}
          className="h-9 w-9 p-0 border-purple-200 hover:bg-purple-50"
          title="Cut"
        >
          <Scissors className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="h-9 w-9 p-0 border-purple-200 hover:bg-purple-50"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onPaste}
          disabled={!canPaste}
          className="h-9 w-9 p-0 border-purple-200 hover:bg-purple-50 disabled:opacity-50"
          title="Paste"
        >
          <Clipboard className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRename}
          disabled={!canRename}
          className="h-9 w-9 p-0 border-purple-200 hover:bg-purple-50 disabled:opacity-50"
          title="Rename"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="h-9 w-9 p-0 border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface PhotoViewerDialogProps {
  isOpen: boolean;
  photoUrl: string;
  photoName: string;
  onClose: () => void;
}

export function PhotoViewerDialog({ isOpen, photoUrl, photoName, onClose }: PhotoViewerDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white p-0"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Photo Name */}
          <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white">{photoName}</p>
          </div>

          {/* Photo */}
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.1 }}
            src={photoUrl}
            alt={photoName}
            className="max-w-[90%] max-h-[90%] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
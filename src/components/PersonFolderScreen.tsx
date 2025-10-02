import { motion } from 'motion/react';
import { ArrowLeft, Camera, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

import { Person, SelectionState } from '../types';
import { useCallback, useRef } from 'react';

interface PersonFolderScreenProps {
  person: Person;
  onBack: () => void;
  onOpenCamera: () => void;
  onViewPhoto: (photoId: string) => void;

  selectionState: SelectionState;
  onLongPress: (itemId: string, itemType: 'group' | 'person' | 'photo') => void;
  onToggleSelection: (itemId: string) => void;
}

export function PersonFolderScreen({ 
  person, 
  onBack, 
  onOpenCamera,
  onViewPhoto,

  selectionState,
  onLongPress,
  onToggleSelection
}: PersonFolderScreenProps) {
  const pressTimerRef = useRef<NodeJS.Timeout>();

  const handleMouseDown = useCallback((photoId: string) => {
    pressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress(photoId, 'photo');
    }, 500);
  }, [onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  }, []);

  const handlePhotoClick = useCallback((photoId: string) => {
    if (selectionState.isSelectionMode) {
      onToggleSelection(photoId);
    } else {
      onViewPhoto(photoId);
    }
  }, [selectionState.isSelectionMode, onToggleSelection, onViewPhoto]);
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-purple-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate">{person.name}</h1>
            <p className="text-gray-500 text-sm">
              {person.photos.length} {person.photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {person.photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 mb-2">No photos yet</h3>
            <p className="text-gray-400 text-sm">
              Take photos to add them to this person's folder
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {person.photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`overflow-hidden backdrop-blur-sm border-purple-100 relative group cursor-pointer ${
                    selectionState.selectedItems.has(photo.id)
                      ? 'ring-2 ring-purple-600 bg-purple-50'
                      : 'bg-white/70 hover:bg-white/90'
                  }`}
                  onClick={() => handlePhotoClick(photo.id)}
                  onMouseDown={() => handleMouseDown(photo.id)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={() => handleMouseDown(photo.id)}
                  onTouchEnd={handleMouseUp}
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 relative overflow-hidden">
                    {photo.url ? (
                      <img 
                        src={photo.url} 
                        alt={photo.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {selectionState.selectedItems.has(photo.id) && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm truncate">{photo.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(photo.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Camera Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-6"
      >
        <Button
          onClick={onOpenCamera}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
        >
          <Camera className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-gray-400 text-xs">Made by Valapatla Yaswanth</p>
      </div>
    </div>
  );
}
import { motion } from 'motion/react';
import { Plus, Users, Folder, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

import { Group, SelectionState } from '../types';
import { useCallback, useRef } from 'react';

interface HomeScreenProps {
  groups: Group[];
  onAddGroup: () => void;
  onSelectGroup: (groupId: string) => void;

  selectionState: SelectionState;
  onLongPress: (itemId: string, itemType: 'group' | 'person' | 'photo') => void;
  onToggleSelection: (itemId: string) => void;
}

export function HomeScreen({ 
  groups, 
  onAddGroup, 
  onSelectGroup, 

  selectionState,
  onLongPress,
  onToggleSelection 
}: HomeScreenProps) {
  const pressTimerRef = useRef<NodeJS.Timeout>();

  const handleMouseDown = useCallback((groupId: string) => {
    pressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress(groupId, 'group');
    }, 500);
  }, [onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  }, []);

  const handleGroupClick = useCallback((groupId: string) => {
    if (selectionState.isSelectionMode) {
      onToggleSelection(groupId);
    } else {
      onSelectGroup(groupId);
    }
  }, [selectionState.isSelectionMode, onToggleSelection, onSelectGroup]);
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4">
        <h1 className="text-center">All Groups</h1>
        <p className="text-center text-gray-500 text-sm mt-1">
          {groups.length} {groups.length === 1 ? 'group' : 'groups'} total
        </p>
      </div>

      {/* Groups List */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 mb-2">No groups yet</h3>
            <p className="text-gray-400 text-sm">
              Create your first group to get started
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`p-4 backdrop-blur-sm border-purple-100 transition-all relative ${
                    selectionState.selectedItems.has(group.id)
                      ? 'bg-purple-100 border-purple-300 shadow-md'
                      : 'bg-white/70 hover:bg-white/90'
                  }`}
                >
                  <div 
                    className="flex items-center space-x-4 cursor-pointer"
                    onClick={() => handleGroupClick(group.id)}
                    onMouseDown={() => handleMouseDown(group.id)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={() => handleMouseDown(group.id)}
                    onTouchEnd={handleMouseUp}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1">{group.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        <span>
                          {group.persons.length} {group.persons.length === 1 ? 'person' : 'persons'}
                        </span>
                      </div>
                    </div>
                    {selectionState.selectedItems.has(group.id) && (
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-6"
      >
        <Button
          onClick={onAddGroup}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-gray-400 text-xs">Made by Valapatla Yaswanth</p>
      </div>
    </div>
  );
}
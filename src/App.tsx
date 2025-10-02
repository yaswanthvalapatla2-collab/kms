import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppState, Group, Person, Photo, SelectionState, ClipboardData } from './types';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/HomeScreen';
import { GroupDetailsScreen } from './components/GroupDetailsScreen';
import { PersonFolderScreen } from './components/PersonFolderScreen';
import { CameraScreen } from './components/CameraScreen';
import { AddDialog } from './components/AddDialog';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ActionBar } from './components/ActionBar';
import { RenameDialog } from './components/RenameDialog';
import { PhotoViewerDialog } from './components/PhotoViewerDialog';

export default function App() {
  const [groups, setGroups] = useLocalStorage<Group[]>('keerthi-groups', []);
  const [currentScreen, setCurrentScreen] = useState<AppState['currentScreen']>('splash');
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    isSelectionMode: false,
    selectedItems: new Set(),
    itemType: null
  });

  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    currentName: string;
    title: string;
  }>({
    isOpen: false,
    itemId: '',
    currentName: '',
    title: ''
  });

  const [viewPhotoDialog, setViewPhotoDialog] = useState<{
    isOpen: boolean;
    photoUrl: string;
    photoName: string;
  }>({
    isOpen: false,
    photoUrl: '',
    photoName: ''
  });

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : undefined;
  const selectedPerson = selectedGroup && selectedPersonId 
    ? selectedGroup.persons.find(p => p.id === selectedPersonId) 
    : undefined;

  const handleSplashComplete = useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleAddGroup = useCallback((name: string) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      persons: []
    };
    setGroups(prev => [...prev, newGroup].sort((a, b) => a.name.localeCompare(b.name)));
  }, [setGroups]);

  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentScreen('group-details');
  }, []);

  const handleAddPerson = useCallback((name: string) => {
    if (!selectedGroupId) return;
    
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      photos: []
    };

    setGroups(prev => prev.map(group => 
      group.id === selectedGroupId 
        ? { ...group, persons: [...group.persons, newPerson] }
        : group
    ));
  }, [selectedGroupId, setGroups]);

  const handleSelectPerson = useCallback((personId: string) => {
    setSelectedPersonId(personId);
    setCurrentScreen('person-folder');
  }, []);

  const handleBackToHome = useCallback(() => {
    setSelectedGroupId(undefined);
    setSelectedPersonId(undefined);
    setCurrentScreen('home');
  }, []);

  const handleBackToGroup = useCallback(() => {
    setSelectedPersonId(undefined);
    setCurrentScreen('group-details');
  }, []);

  const handleBackToPersonFolder = useCallback(() => {
    setCurrentScreen('person-folder');
  }, []);

  const handleViewPhoto = useCallback((photoId: string) => {
    if (!selectedGroupId || !selectedPersonId) return;

    const group = groups.find(g => g.id === selectedGroupId);
    const person = group?.persons.find(p => p.id === selectedPersonId);
    const photo = person?.photos.find(p => p.id === photoId);

    if (photo) {
      setViewPhotoDialog({
        isOpen: true,
        photoUrl: photo.url,
        photoName: photo.name
      });
    }
  }, [groups, selectedGroupId, selectedPersonId]);

  const handleSavePhoto = useCallback((photoName: string, photoData: string) => {
    if (!selectedGroupId || !selectedPersonId) return;

    const newPhoto: Photo = {
      id: Date.now().toString(),
      name: photoName,
      url: photoData,
      timestamp: Date.now()
    };

    setGroups(prev => prev.map(group => 
      group.id === selectedGroupId 
        ? {
            ...group,
            persons: group.persons.map(person =>
              person.id === selectedPersonId
                ? { ...person, photos: [...person.photos, newPhoto] }
                : person
            )
          }
        : group
    ));
  }, [selectedGroupId, selectedPersonId, setGroups]);



  // Selection handlers
  const handleLongPress = useCallback((itemId: string, itemType: 'group' | 'person' | 'photo') => {
    setSelectionState({
      isSelectionMode: true,
      selectedItems: new Set([itemId]),
      itemType
    });
  }, []);

  const handleToggleSelection = useCallback((itemId: string) => {
    setSelectionState(prev => {
      const newSelected = new Set(prev.selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      
      return {
        ...prev,
        selectedItems: newSelected,
        isSelectionMode: newSelected.size > 0
      };
    });
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectionState({
      isSelectionMode: false,
      selectedItems: new Set(),
      itemType: null
    });
  }, []);

  // Clipboard operations
  const handleCut = useCallback(() => {
    if (!selectionState.isSelectionMode || !selectionState.itemType) return;

    const items: any[] = [];
    const selectedIds = Array.from(selectionState.selectedItems);

    if (selectionState.itemType === 'group') {
      selectedIds.forEach(id => {
        const group = groups.find(g => g.id === id);
        if (group) items.push(group);
      });
    } else if (selectionState.itemType === 'person' && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      selectedIds.forEach(id => {
        const person = group?.persons.find(p => p.id === id);
        if (person) items.push(person);
      });
    } else if (selectionState.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const person = group?.persons.find(p => p.id === selectedPersonId);
      selectedIds.forEach(id => {
        const photo = person?.photos.find(p => p.id === id);
        if (photo) items.push(photo);
      });
    }

    setClipboard({
      items,
      type: 'cut',
      itemType: selectionState.itemType
    });

    handleCancelSelection();
  }, [selectionState, groups, selectedGroupId, selectedPersonId, handleCancelSelection]);

  const handleCopy = useCallback(() => {
    if (!selectionState.isSelectionMode || !selectionState.itemType) return;

    const items: any[] = [];
    const selectedIds = Array.from(selectionState.selectedItems);

    if (selectionState.itemType === 'group') {
      selectedIds.forEach(id => {
        const group = groups.find(g => g.id === id);
        if (group) items.push({ ...group });
      });
    } else if (selectionState.itemType === 'person' && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      selectedIds.forEach(id => {
        const person = group?.persons.find(p => p.id === id);
        if (person) items.push({ ...person });
      });
    } else if (selectionState.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const person = group?.persons.find(p => p.id === selectedPersonId);
      selectedIds.forEach(id => {
        const photo = person?.photos.find(p => p.id === id);
        if (photo) items.push({ ...photo });
      });
    }

    setClipboard({
      items,
      type: 'copy',
      itemType: selectionState.itemType
    });

    handleCancelSelection();
  }, [selectionState, groups, selectedGroupId, selectedPersonId, handleCancelSelection]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;

    if (clipboard.itemType === 'group') {
      const newGroups = clipboard.items.map(group => ({
        ...group,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: clipboard.type === 'cut' ? group.name : `${group.name} (Copy)`
      }));

      setGroups(prev => {
        let updatedGroups = [...prev];
        
        if (clipboard.type === 'cut') {
          // Remove original items for cut operation
          const originalIds = clipboard.items.map(item => item.id);
          updatedGroups = updatedGroups.filter(g => !originalIds.includes(g.id));
        }
        
        return [...updatedGroups, ...newGroups].sort((a, b) => a.name.localeCompare(b.name));
      });
    } else if (clipboard.itemType === 'person' && selectedGroupId) {
      const newPersons = clipboard.items.map(person => ({
        ...person,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: clipboard.type === 'cut' ? person.name : `${person.name} (Copy)`
      }));

      setGroups(prev => prev.map(group => {
        if (group.id === selectedGroupId) {
          let updatedPersons = [...group.persons];
          
          if (clipboard.type === 'cut') {
            // Remove original items for cut operation
            const originalIds = clipboard.items.map(item => item.id);
            updatedPersons = updatedPersons.filter(p => !originalIds.includes(p.id));
          }
          
          return { ...group, persons: [...updatedPersons, ...newPersons] };
        }
        return group;
      }));
    } else if (clipboard.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      const newPhotos = clipboard.items.map(photo => ({
        ...photo,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: clipboard.type === 'cut' ? photo.name : `${photo.name} (Copy)`,
        timestamp: Date.now()
      }));

      setGroups(prev => prev.map(group => 
        group.id === selectedGroupId 
          ? {
              ...group,
              persons: group.persons.map(person => {
                if (person.id === selectedPersonId) {
                  let updatedPhotos = [...person.photos];
                  
                  if (clipboard.type === 'cut') {
                    // Remove original items for cut operation
                    const originalIds = clipboard.items.map(item => item.id);
                    updatedPhotos = updatedPhotos.filter(p => !originalIds.includes(p.id));
                  }
                  
                  return { ...person, photos: [...updatedPhotos, ...newPhotos] };
                }
                return person;
              })
            }
          : group
      ));
    }

    setClipboard(null);
  }, [clipboard, selectedGroupId, selectedPersonId, setGroups]);

  const handleRename = useCallback(() => {
    if (selectionState.selectedItems.size !== 1 || !selectionState.itemType) return;

    const itemId = Array.from(selectionState.selectedItems)[0];
    let currentName = '';
    let title = '';

    if (selectionState.itemType === 'group') {
      const group = groups.find(g => g.id === itemId);
      if (group) {
        currentName = group.name;
        title = 'Rename Group';
      }
    } else if (selectionState.itemType === 'person' && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const person = group?.persons.find(p => p.id === itemId);
      if (person) {
        currentName = person.name;
        title = 'Rename Person';
      }
    } else if (selectionState.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const person = group?.persons.find(p => p.id === selectedPersonId);
      const photo = person?.photos.find(p => p.id === itemId);
      if (photo) {
        currentName = photo.name;
        title = 'Rename Photo';
      }
    }

    setRenameDialog({
      isOpen: true,
      itemId,
      currentName,
      title
    });
  }, [selectionState, groups, selectedGroupId, selectedPersonId]);

  const handleRenameConfirm = useCallback((newName: string) => {
    const itemId = renameDialog.itemId;

    if (selectionState.itemType === 'group') {
      setGroups(prev => prev.map(group => 
        group.id === itemId ? { ...group, name: newName } : group
      ));
    } else if (selectionState.itemType === 'person' && selectedGroupId) {
      setGroups(prev => prev.map(group => 
        group.id === selectedGroupId 
          ? {
              ...group,
              persons: group.persons.map(person =>
                person.id === itemId ? { ...person, name: newName } : person
              )
            }
          : group
      ));
    } else if (selectionState.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      setGroups(prev => prev.map(group => 
        group.id === selectedGroupId 
          ? {
              ...group,
              persons: group.persons.map(person =>
                person.id === selectedPersonId
                  ? { 
                      ...person, 
                      photos: person.photos.map(photo =>
                        photo.id === itemId ? { ...photo, name: newName } : photo
                      )
                    }
                  : person
              )
            }
          : group
      ));
    }

    handleCancelSelection();
  }, [renameDialog.itemId, selectionState.itemType, selectedGroupId, selectedPersonId, setGroups, handleCancelSelection]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectionState.isSelectionMode || selectionState.selectedItems.size === 0) return;

    const selectedIds = Array.from(selectionState.selectedItems);
    let itemNames: string[] = [];

    if (selectionState.itemType === 'group') {
      itemNames = selectedIds.map(id => {
        const group = groups.find(g => g.id === id);
        return group?.name || '';
      }).filter(Boolean);
    } else if (selectionState.itemType === 'person' && selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      itemNames = selectedIds.map(id => {
        const person = group?.persons.find(p => p.id === id);
        return person?.name || '';
      }).filter(Boolean);
    } else if (selectionState.itemType === 'photo' && selectedGroupId && selectedPersonId) {
      const group = groups.find(g => g.id === selectedGroupId);
      const person = group?.persons.find(p => p.id === selectedPersonId);
      itemNames = selectedIds.map(id => {
        const photo = person?.photos.find(p => p.id === id);
        return photo?.name || '';
      }).filter(Boolean);
    }

    const itemType = selectionState.itemType;
    const message = selectedIds.length === 1
      ? `Are you sure you want to delete "${itemNames[0]}"?`
      : `Are you sure you want to delete ${selectedIds.length} ${itemType}s?`;

    setConfirmDialog({
      isOpen: true,
      title: `Delete ${itemType}${selectedIds.length > 1 ? 's' : ''}`,
      message,
      onConfirm: () => {
        if (itemType === 'group') {
          setGroups(prev => prev.filter(g => !selectedIds.includes(g.id)));
          if (selectedGroupId && selectedIds.includes(selectedGroupId)) {
            handleBackToHome();
          }
        } else if (itemType === 'person' && selectedGroupId) {
          setGroups(prev => prev.map(group => 
            group.id === selectedGroupId 
              ? { ...group, persons: group.persons.filter(p => !selectedIds.includes(p.id)) }
              : group
          ));
          if (selectedPersonId && selectedIds.includes(selectedPersonId)) {
            handleBackToGroup();
          }
        } else if (itemType === 'photo' && selectedGroupId && selectedPersonId) {
          setGroups(prev => prev.map(group => 
            group.id === selectedGroupId 
              ? {
                  ...group,
                  persons: group.persons.map(person =>
                    person.id === selectedPersonId
                      ? { ...person, photos: person.photos.filter(p => !selectedIds.includes(p.id)) }
                      : person
                  )
                }
              : group
          ));
        }
        
        handleCancelSelection();
      }
    });
  }, [selectionState, groups, selectedGroupId, selectedPersonId, setGroups, handleBackToHome, handleBackToGroup, handleCancelSelection]);

  return (
    <div className="size-full">
      <AnimatePresence mode="wait">
        {currentScreen === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SplashScreen onComplete={handleSplashComplete} />
          </motion.div>
        )}

        {currentScreen === 'home' && (
          <motion.div
            key="home"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HomeScreen
              groups={groups}
              onAddGroup={() => setShowAddGroupDialog(true)}
              onSelectGroup={handleSelectGroup}
              selectionState={selectionState}
              onLongPress={handleLongPress}
              onToggleSelection={handleToggleSelection}
            />
          </motion.div>
        )}

        {currentScreen === 'group-details' && selectedGroup && (
          <motion.div
            key="group-details"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GroupDetailsScreen
              group={selectedGroup}
              onBack={handleBackToHome}
              onAddPerson={() => setShowAddPersonDialog(true)}
              onSelectPerson={handleSelectPerson}
              selectionState={selectionState}
              onLongPress={handleLongPress}
              onToggleSelection={handleToggleSelection}
            />
          </motion.div>
        )}

        {currentScreen === 'person-folder' && selectedPerson && (
          <motion.div
            key="person-folder"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PersonFolderScreen
              person={selectedPerson}
              onBack={handleBackToGroup}
              onOpenCamera={() => setCurrentScreen('camera')}
              onViewPhoto={handleViewPhoto}
              selectionState={selectionState}
              onLongPress={handleLongPress}
              onToggleSelection={handleToggleSelection}
            />
          </motion.div>
        )}

        {currentScreen === 'camera' && (
          <motion.div
            key="camera"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CameraScreen
              onBack={handleBackToPersonFolder}
              onSavePhoto={handleSavePhoto}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Group Dialog */}
      <AddDialog
        isOpen={showAddGroupDialog}
        onClose={() => setShowAddGroupDialog(false)}
        onAdd={handleAddGroup}
        title="Add New Group"
        placeholder="Enter group name..."
      />

      {/* Add Person Dialog */}
      <AddDialog
        isOpen={showAddPersonDialog}
        onClose={() => setShowAddPersonDialog(false)}
        onAdd={handleAddPerson}
        title="Add New Person"
        placeholder="Enter person name..."
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={renameDialog.isOpen}
        onClose={() => setRenameDialog(prev => ({ ...prev, isOpen: false }))}
        onRename={handleRenameConfirm}
        currentName={renameDialog.currentName}
        title={renameDialog.title}
      />

      {/* Action Bar */}
      <AnimatePresence>
        {selectionState.isSelectionMode && (
          <ActionBar
            selectedCount={selectionState.selectedItems.size}
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onRename={handleRename}
            onDelete={handleDeleteSelected}
            onCancel={handleCancelSelection}
            canRename={selectionState.selectedItems.size === 1}
            canPaste={clipboard !== null && clipboard.itemType === selectionState.itemType}
          />
        )}
      </AnimatePresence>

      {/* Photo Viewer Dialog */}
      <PhotoViewerDialog
        isOpen={viewPhotoDialog.isOpen}
        photoUrl={viewPhotoDialog.photoUrl}
        photoName={viewPhotoDialog.photoName}
        onClose={() => setViewPhotoDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
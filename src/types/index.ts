export interface Photo {
  id: string;
  name: string;
  url: string;
  timestamp: number;
}

export interface Person {
  id: string;
  name: string;
  photos: Photo[];
}

export interface Group {
  id: string;
  name: string;
  persons: Person[];
}

export type Screen = 
  | 'splash'
  | 'home'
  | 'group-details'
  | 'person-folder'
  | 'camera';

export interface AppState {
  currentScreen: Screen;
  selectedGroupId?: string;
  selectedPersonId?: string;
  groups: Group[];
}

export interface SelectionState {
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  itemType: 'group' | 'person' | 'photo' | null;
}

export interface ClipboardData {
  items: any[];
  type: 'cut' | 'copy';
  itemType: 'group' | 'person' | 'photo';
}
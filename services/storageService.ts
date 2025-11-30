
import { LibraryItem, SavedSession, LibraryItemType } from '../types';

const LIB_KEY = 'philo_flow_library_v1';

export const getLibrary = (): LibraryItem[] => {
  const data = localStorage.getItem(LIB_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLibrary = (items: LibraryItem[]) => {
  localStorage.setItem(LIB_KEY, JSON.stringify(items));
};

export const createFolder = (name: string): LibraryItem[] => {
  const library = getLibrary();
  const newFolder: LibraryItem = {
    id: `folder-${Date.now()}`,
    type: 'folder',
    name,
    children: [],
    createdAt: Date.now()
  };
  const updated = [newFolder, ...library];
  saveLibrary(updated);
  return updated;
};

export const saveSessionToFolder = (folderId: string, name: string, sessionData: SavedSession): LibraryItem[] => {
  const library = getLibrary();
  
  const updateRecursive = (items: LibraryItem[]): LibraryItem[] => {
    return items.map(item => {
      if (item.id === folderId && item.type === 'folder') {
        const newFile: LibraryItem = {
          id: `file-${Date.now()}`,
          type: 'file',
          name,
          data: sessionData,
          createdAt: Date.now()
        };
        // Add to beginning of children
        return { ...item, children: [newFile, ...(item.children || [])] };
      }
      if (item.children) {
        return { ...item, children: updateRecursive(item.children) };
      }
      return item;
    });
  };

  const updated = updateRecursive(library);
  saveLibrary(updated);
  return updated;
};

export const deleteItem = (itemId: string): LibraryItem[] => {
  const library = getLibrary();

  const filterRecursive = (items: LibraryItem[]): LibraryItem[] => {
    return items
      .filter(item => item.id !== itemId)
      .map(item => {
        if (item.children) {
          return { ...item, children: filterRecursive(item.children) };
        }
        return item;
      });
  };

  const updated = filterRecursive(library);
  saveLibrary(updated);
  return updated;
};

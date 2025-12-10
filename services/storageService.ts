
import { LibraryItem, SavedSession } from '../types';

const DB_NAME = 'PhiloFlowDB';
const DB_VERSION = 1;
const STORE_KEY = 'root_library';
const STORE_NAME = 'library_store';

// Helper: Open Database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Helper: Get the entire library tree
export const getLibrary = async (): Promise<LibraryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STORE_KEY);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
};

// Helper: Save the entire library tree
const saveLibraryData = async (data: LibraryItem[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, STORE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- CRUD Operations ---

export const createFolder = async (name: string): Promise<LibraryItem[]> => {
  const library = await getLibrary();
  const newFolder: LibraryItem = {
    id: `folder-${Date.now()}`,
    type: 'folder',
    name,
    children: [],
    createdAt: Date.now()
  };
  const updated = [newFolder, ...library];
  await saveLibraryData(updated);
  return updated;
};

export const saveSessionToFolder = async (folderId: string, name: string, sessionData: SavedSession): Promise<LibraryItem[]> => {
  const library = await getLibrary();
  
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
  await saveLibraryData(updated);
  return updated;
};

export const deleteItem = async (itemId: string): Promise<LibraryItem[]> => {
  const library = await getLibrary();

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
  await saveLibraryData(updated);
  return updated;
};

export const renameItem = async (itemId: string, newName: string): Promise<LibraryItem[]> => {
    const library = await getLibrary();
  
    const updateRecursive = (items: LibraryItem[]): LibraryItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, name: newName };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
  
    const updated = updateRecursive(library);
    await saveLibraryData(updated);
    return updated;
};
import { db } from "@/public/mock-data/mock-data";
import { List } from "@/types";

export const listService = {
  getLists: async (projectId: string): Promise<List[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.lists
      .filter((l) => l.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  },

  getListById: async (id: string): Promise<List | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.lists.find((l) => l.id === id);
  },

  createList: async (list: List): Promise<List> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.lists.push(list);
    return list;
  },

  updateList: async (
    id: string,
    updates: Partial<List>
  ): Promise<List | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.lists.findIndex((l) => l.id === id);
    if (index !== -1) {
      db.lists[index] = { ...db.lists[index], ...updates };
      return db.lists[index];
    }
    return undefined;
  },

  deleteList: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.lists.findIndex((l) => l.id === id);
    if (index !== -1) {
      db.lists.splice(index, 1);
    }
  },

  reorderLists: async (projectId: string, lists: List[]): Promise<List[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // In a real app, we would update positions in the DB
    // For mock, we just update the positions in the mock DB
    lists.forEach((list, index) => {
        const dbList = db.lists.find(l => l.id === list.id);
        if (dbList) {
            dbList.position = index + 1;
        }
    });
    return lists;
  }
};

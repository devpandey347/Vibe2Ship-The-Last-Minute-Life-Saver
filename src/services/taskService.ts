import { db } from './firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { Task } from '../types';

import { DEMO_TASKS } from './demoData';

const TASKS_COLLECTION = 'tasks';

let demoTasksMemory = [...DEMO_TASKS];

export const isDemoMode = () => true;

export const taskService = {
  async createTask(taskData: Omit<Task, 'id'>): Promise<string> {
    if (isDemoMode()) {
      const id = 'demo_new_' + Date.now();
      demoTasksMemory.unshift({ id, ...taskData } as Task);
      return id;
    }
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);
    await import('./scheduleService').then(m => m.scheduleService.markScheduleOutdated());
    return docRef.id;
  },

  async getTasks(): Promise<Task[]> {
    if (isDemoMode()) return [...demoTasksMemory];
    const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  },

  async getTask(id: string): Promise<Task | null> {
    if (isDemoMode()) return demoTasksMemory.find(t => t.id === id) || null;
    const docRef = doc(db, TASKS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Task;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (isDemoMode()) {
      demoTasksMemory = demoTasksMemory.map(t => t.id === id ? { ...t, ...updates } : t);
      return;
    }
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, updates);
    await import('./scheduleService').then(m => m.scheduleService.markScheduleOutdated());
  },

  async deleteTask(id: string): Promise<void> {
    if (isDemoMode()) {
      demoTasksMemory = demoTasksMemory.filter(t => t.id !== id);
      return;
    }
    const docRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(docRef);
    await import('./scheduleService').then(m => m.scheduleService.markScheduleOutdated());
  }
};

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { MasterSchedule } from '../types';
import { DEMO_SCHEDULE } from './demoData';

const SCHEDULE_DOC_ID = 'currentSchedule';
const SCHEDULE_COLLECTION = 'aiSchedule';

let demoScheduleMemory: MasterSchedule = { ...DEMO_SCHEDULE };

export const scheduleService = {
  getSchedule: async (): Promise<MasterSchedule | null> => {
    import('./taskService').then(m => {
      if (!m.isDemoMode()) return;
    });
    // For sync check:
    if (localStorage.getItem('demoMode') === 'true') {
      return demoScheduleMemory;
    }
    const docRef = doc(db, SCHEDULE_COLLECTION, SCHEDULE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MasterSchedule;
    }
    return null;
  },

  saveSchedule: async (schedule: MasterSchedule): Promise<void> => {
    if (localStorage.getItem('demoMode') === 'true') {
      demoScheduleMemory = schedule;
      return;
    }
    const docRef = doc(db, SCHEDULE_COLLECTION, SCHEDULE_DOC_ID);
    await setDoc(docRef, schedule);
  },

  markScheduleOutdated: async (): Promise<void> => {
    const current = await scheduleService.getSchedule();
    if (current && !current.isOutdated) {
      await scheduleService.saveSchedule({ ...current, isOutdated: true });
    }
  },

  triggerReplan: async (): Promise<MasterSchedule | null> => {
    const { taskService } = await import('./taskService');
    const { generateMasterTimeline } = await import('./gemini');
    const { calendarService } = await import('./calendarService');
    try {
      const tasks = await taskService.getTasks();
      const busySlots = await calendarService.getUpcomingEvents();
      const aiSchedule = await generateMasterTimeline(tasks, busySlots);
      
      const newSchedule: MasterSchedule = {
        ...aiSchedule,
        generatedAt: Date.now(),
        isOutdated: false
      };
      
      await scheduleService.saveSchedule(newSchedule);
      return newSchedule;
    } catch (error) {
      console.error("Failed to replan schedule", error);
      return null; // Return null so we can keep the old schedule as requested
    }
  }
};

import type { BusySlot } from '../types';

export const calendarService = {
  getAccessToken: () => localStorage.getItem('google_access_token'),
  getEmail: () => localStorage.getItem('google_email'),
  getLastSync: () => localStorage.getItem('google_last_sync'),
  
  setAccessToken: (token: string | null, email?: string) => {
    if (token) {
      localStorage.setItem('google_access_token', token);
      if (email) localStorage.setItem('google_email', email);
    } else {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_email');
      localStorage.removeItem('google_last_sync');
    }
  },

  fetchUserProfile: async (token: string): Promise<string | null> => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.email || null;
    } catch {
      return null;
    }
  },

  getUpcomingEvents: async (): Promise<BusySlot[]> => {
    const token = calendarService.getAccessToken();
    if (!token) return [];

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          calendarService.setAccessToken(null);
        }
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      
      localStorage.setItem('google_last_sync', new Date().toLocaleString());

      return (data.items || []).map((item: any) => ({
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        summary: item.summary || 'Busy'
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }
};

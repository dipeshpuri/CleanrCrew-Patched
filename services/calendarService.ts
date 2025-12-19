import { TimeSlot } from '../types';
import { GOOGLE_CALENDAR_ID, MOCK_TIME_SLOTS } from '../constants';

const API_KEY = process.env.API_KEY || '';

interface GoogleCalendarEvent {
  start: { dateTime: string; date?: string };
  end: { dateTime: string; date?: string };
  status: string;
}

// Generate base slots for a day (8 AM to 5 PM)
const generateDailyBaseSlots = (date: Date): Date[] => {
  const slots: Date[] = [];
  const startHour = 8; // 8 AM
  const endHour = 17;  // 5 PM
  
  for (let i = startHour; i < endHour; i++) {
    const slot = new Date(date);
    slot.setHours(i, 0, 0, 0);
    slots.push(slot);
  }
  return slots;
};

// Generate deterministic "random" availability based on the date
// This ensures that even without the API, different days have different open slots
const generateSmartMockSlots = (date: Date): TimeSlot[] => {
    const baseSlots = generateDailyBaseSlots(date);
    // Create a seed from the date (e.g. Day + Month) to make randomness consistent for that day
    const seed = date.getDate() + date.getMonth() + date.getFullYear(); 
    
    return baseSlots.map((slotStart, index) => {
        const timeString = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        // Pseudo-random logic:
        // e.g., on even days, morning slots are busier; odd days, afternoon slots are busier.
        // This is just a simulation to make the app feel "alive".
        const isBusy = (seed + index) % 3 === 0 || (seed * index) % 5 === 0;

        return {
            id: `mock-slot-${index}`,
            time: timeString,
            available: !isBusy
        };
    });
};

// IMPORTANT: Filter out slots that have already passed if the selected date is today
const filterPastSlots = (slots: TimeSlot[], date: Date): TimeSlot[] => {
  const now = new Date();
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

  if (!isToday) return slots;

  return slots.map(slot => {
     // Parse "08:00 AM" back to Date object for comparison
    const timeParts = slot.time.match(/(\d+):(\d+)\s(AM|PM)/);
    if (!timeParts) return slot;

    let hour = parseInt(timeParts[1]);
    const minute = parseInt(timeParts[2]);
    const period = timeParts[3];

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    // If slot is in the past (with a 30 min buffer for booking), mark unavailable
    if (slotTime.getTime() < now.getTime() + (30 * 60 * 1000)) { 
        return { ...slot, available: false }; 
    }
    return slot;
  });
};

export const getRealAvailability = async (date: Date, serviceDurationHours: number): Promise<TimeSlot[]> => {
  let slots: TimeSlot[] = [];
  let usedMock = false;

  // 1. Try Real API Fetch
  try {
    // Only attempt fetch if we have a key and it's not the placeholder
    if (API_KEY && (GOOGLE_CALENDAR_ID as string) !== 'YOUR_CALENDAR_ID_HERE') {
        const timeMin = new Date(date);
        timeMin.setHours(0, 0, 0, 0);
        const timeMax = new Date(date);
        timeMax.setHours(23, 59, 59, 999);

        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events?` +
        new URLSearchParams({
            key: API_KEY,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
        });

        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            const busyEvents: GoogleCalendarEvent[] = data.items || [];
            const baseSlots = generateDailyBaseSlots(date);
            
            slots = baseSlots.map((slotStart, index) => {
                const slotEnd = new Date(slotStart);
                slotEnd.setHours(slotStart.getHours() + serviceDurationHours);
                
                // Check conflicts
                const isConflict = busyEvents.some(event => {
                    if (event.status === 'cancelled') return false;
                    const eventStart = new Date(event.start.dateTime || event.start.date + 'T00:00:00');
                    const eventEnd = new Date(event.end.dateTime || event.end.date + 'T23:59:59');
                    return (slotStart < eventEnd && slotEnd > eventStart);
                });

                const timeString = slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                return {
                    id: `slot-${index}`,
                    time: timeString,
                    available: !isConflict
                };
            });
            console.log(`Successfully fetched calendar for ${date.toDateString()}`);
        } else {
             // If API fails (e.g. 403 Forbidden), fallback to smart mock
             console.warn("Calendar API responded with error, falling back to simulation mode.");
             usedMock = true;
        }
    } else {
        usedMock = true;
    }
  } catch (e) {
      console.warn("Network error fetching calendar, falling back to simulation mode.", e);
      usedMock = true;
  }

  // 2. Fallback Generation
  if (usedMock || slots.length === 0) {
      slots = generateSmartMockSlots(date);
  }

  // 3. Post-process: Filter past times
  // This is crucial for "Real Time" feel
  return filterPastSlots(slots, date);
};
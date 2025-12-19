import { BookingRecord } from '../types';

const STORAGE_KEY_BOOKINGS = 'cleanr_bookings';

export const saveBooking = (booking: BookingRecord): void => {
  const existingStr = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  const bookings: BookingRecord[] = existingStr ? JSON.parse(existingStr) : [];
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
};

export const getUserBookings = (userId: string): BookingRecord[] => {
  const existingStr = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  const bookings: BookingRecord[] = existingStr ? JSON.parse(existingStr) : [];
  
  // Filter by user and sort by date (newest first)
  return bookings
    .filter(b => b.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const cancelBooking = (bookingId: string): boolean => {
    const existingStr = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (!existingStr) return false;

    let bookings: BookingRecord[] = JSON.parse(existingStr);
    const index = bookings.findIndex(b => b.id === bookingId);
    
    if (index !== -1) {
        bookings[index].status = 'cancelled';
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
        return true;
    }
    return false;
};
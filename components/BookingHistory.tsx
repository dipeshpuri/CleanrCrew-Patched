import React, { useEffect, useState } from 'react';
import { User, BookingRecord } from '../types';
import { getUserBookings, cancelBooking } from '../services/bookingStorageService';
import { Calendar, Clock, MapPin, DollarSign, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants';

interface BookingHistoryProps {
  currentUser: User | null;
  onBack: () => void;
}

export default function BookingHistory({ currentUser, onBack }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (currentUser) {
      const userBookings = getUserBookings(currentUser.id);
      setBookings(userBookings);
    }
  }, [currentUser]);

  const handleCancel = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
        const success = cancelBooking(id);
        if (success && currentUser) {
            // Refresh list
            setBookings(getUserBookings(currentUser.id));
        }
    }
  };

  const getServiceIcon = (type: string) => {
      const option = SERVICE_OPTIONS.find(s => s.id === type);
      return option ? option.icon : '✨';
  };

  const isUpcoming = (booking: BookingRecord) => {
      // If status is specifically cancelled or completed, respect that
      if (booking.status === 'cancelled') return false;
      if (booking.status === 'completed') return false;

      // Otherwise check date
      const bookingDate = new Date(booking.date);
      const now = new Date();
      // Keep it upcoming if it's today or future
      return bookingDate.setHours(0,0,0,0) >= now.setHours(0,0,0,0);
  };

  const upcomingBookings = bookings.filter(b => isUpcoming(b) && b.status !== 'cancelled');
  const pastBookings = bookings.filter(b => !isUpcoming(b) || b.status === 'completed' || b.status === 'cancelled');

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (!currentUser) {
      return (
          <div className="text-center py-20">
              <p className="text-gray-500">Please log in to view your bookings.</p>
              <button onClick={onBack} className="text-brand-600 mt-4 hover:underline">Go Back</button>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <button 
            onClick={onBack}
            className="text-gray-500 hover:text-brand-600 font-medium"
        >
            Back to Home
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-8">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`pb-4 px-6 font-medium text-sm transition-colors relative ${
                activeTab === 'upcoming' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
              Upcoming ({upcomingBookings.length})
              {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`pb-4 px-6 font-medium text-sm transition-colors relative ${
                activeTab === 'past' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
              Past / Cancelled ({pastBookings.length})
              {activeTab === 'past' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600"></div>}
          </button>
      </div>

      {/* List */}
      <div className="space-y-4">
          {displayedBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No {activeTab} bookings</h3>
                  <p className="text-gray-500 mt-1">
                      {activeTab === 'upcoming' ? "You haven't booked any cleans yet." : "No past history found."}
                  </p>
                  {activeTab === 'upcoming' && (
                      <button 
                        onClick={onBack}
                        className="mt-6 bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                      >
                          Book a Clean
                      </button>
                  )}
              </div>
          ) : (
              displayedBookings.map((booking) => (
                  <div key={booking.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6">
                      {/* Left: Icon & Date */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[100px] border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6 gap-2">
                          <div className="text-4xl">{getServiceIcon(booking.serviceType)}</div>
                          <div className="text-center">
                              <p className="font-bold text-gray-900">
                                  {new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-sm text-gray-500">{booking.timeSlot}</p>
                          </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-grow space-y-3">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold text-lg text-gray-900">{booking.serviceTitle}</h3>
                                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">ID: {booking.id}</span>
                                      {booking.status === 'cancelled' ? (
                                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                              <XCircle className="w-3 h-3" /> Cancelled
                                          </span>
                                      ) : booking.status === 'completed' ? (
                                           <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                              <CheckCircle className="w-3 h-3" /> Completed
                                          </span>
                                      ) : (
                                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> Upcoming
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-lg text-gray-900">${booking.totalCost.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">{booking.hours} hours</p>
                              </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 pt-2">
                              <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                  <span className="max-w-xs">{booking.address}</span>
                              </div>
                          </div>
                      </div>

                      {/* Right: Actions */}
                      {activeTab === 'upcoming' && booking.status === 'upcoming' && (
                          <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                              <button 
                                onClick={() => handleCancel(booking.id)}
                                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                  Cancel Booking
                              </button>
                          </div>
                      )}
                  </div>
              ))
          )}
      </div>
    </div>
  );
}
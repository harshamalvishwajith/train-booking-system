const API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || 'http://localhost:3003/api';

export interface BookingPayload {
  scheduleId: string;
  trainId: string;
  seatClass: string;
  passengers: number;
  contactEmail: string;
  journeyDate: string;
  origin: string;
  destination: string;
}

export const createBooking = async (payload: BookingPayload) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel booking');
    }
    return data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

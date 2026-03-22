const API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:3004/api';

export const fetchNotification = async (bookingId: string) => {
  try {
    const response = await fetch(`${API_URL}/notifications/booking/${bookingId}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch notification for booking ${bookingId}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

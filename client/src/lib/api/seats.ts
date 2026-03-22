const API_URL = process.env.NEXT_PUBLIC_SEAT_API_URL || 'http://localhost:3002/api';

export const fetchSeats = async (scheduleId: string) => {
  try {
    const response = await fetch(`${API_URL}/seats/${scheduleId}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch seats for schedule ${scheduleId}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching seats:', error);
    throw error;
  }
};

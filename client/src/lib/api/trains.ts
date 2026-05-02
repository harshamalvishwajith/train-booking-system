const API_URL = process.env.NEXT_PUBLIC_TRAIN_API_URL || 'http://localhost:3001/api';

export interface Train {
  id: string;
  name: string;
  origin?: string;
  destination?: string;
  scheduleId?: string;
  departureTime?: string;
  arrivalTime?: string;
  price?: number;
}

export const fetchTrains = async (origin: string, destination: string, date: string) => {
  const url = new URL(`${API_URL}/schedules`);
  if (origin) url.searchParams.append('origin', origin);
  if (destination) url.searchParams.append('destination', destination);
  if (date) url.searchParams.append('date', date);

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to fetch schedules');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching trains:', error);
    throw error;
  }
};

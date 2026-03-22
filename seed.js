/**
 * Seed script — populates all services with realistic demo data
 * Run: node docs/seed.js
 * Requires all services to be running (docker-compose up)
 */

const axios = require('axios');

const TRAIN_SVC  = 'http://localhost:3001';
const SEAT_SVC   = 'http://localhost:3002';
const BOOK_SVC   = 'http://localhost:3003';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function seed() {
  console.log('🌱 Seeding Train Booking System...\n');

  // ── 1. Create Trains ──────────────────────────────────────────────────────
  console.log('Creating trains...');
  const trains = [
    {
      trainNumber: 'EXP001',
      name: 'Colombo Express',
      type: 'EXPRESS',
      totalSeats: 200,
      classes: [
        { className: 'FIRST',  seatCount: 40,  pricePerKm: 5.0 },
        { className: 'SECOND', seatCount: 80,  pricePerKm: 2.5 },
        { className: 'THIRD',  seatCount: 80,  pricePerKm: 1.2 },
      ],
      amenities: ['AC', 'WiFi', 'Dining Car'],
    },
    {
      trainNumber: 'INT002',
      name: 'Kandy Intercity',
      type: 'INTERCITY',
      totalSeats: 150,
      classes: [
        { className: 'FIRST',  seatCount: 30,  pricePerKm: 4.5 },
        { className: 'SECOND', seatCount: 70,  pricePerKm: 2.2 },
        { className: 'THIRD',  seatCount: 50,  pricePerKm: 1.0 },
      ],
      amenities: ['AC', 'Snack Bar'],
    },
    {
      trainNumber: 'NGT003',
      name: 'Southern Night Mail',
      type: 'NIGHT',
      totalSeats: 120,
      classes: [
        { className: 'FIRST',  seatCount: 20,  pricePerKm: 6.0 },
        { className: 'SECOND', seatCount: 50,  pricePerKm: 3.0 },
        { className: 'THIRD',  seatCount: 50,  pricePerKm: 1.5 },
      ],
      amenities: ['Sleeper Berths', 'AC'],
    },
  ];

  const createdTrains = [];
  for (const t of trains) {
    try {
      const res = await axios.post(`${TRAIN_SVC}/api/trains`, t);
      createdTrains.push(res.data.data);
      console.log(`  ✓ Created train: ${t.trainNumber} — ${t.name}`);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      console.log(`  ⚠ Train ${t.trainNumber}: ${msg}`);
    }
  }

  await sleep(500);

  // ── 2. Create Schedules ───────────────────────────────────────────────────
  console.log('\nCreating schedules...');

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const schedules = [
    {
      trainId: createdTrains[0]?._id,
      journeyDate: tomorrow.toISOString().split('T')[0],
      origin: 'Colombo Fort',
      destination: 'Kandy',
      departureTime: '07:00',
      arrivalTime: '10:30',
      distanceKm: 116,
      stops: [
        { stationName: 'Ragama',  stationCode: 'RGM', arrivalTime: '07:25', departureTime: '07:27', distanceFromOrigin: 20  },
        { stationName: 'Gampaha', stationCode: 'GPH', arrivalTime: '07:45', departureTime: '07:47', distanceFromOrigin: 35  },
        { stationName: 'Rambukkana', stationCode: 'RBK', arrivalTime: '09:00', departureTime: '09:10', distanceFromOrigin: 85 },
      ],
    },
    {
      trainId: createdTrains[0]?._id,
      journeyDate: nextWeek.toISOString().split('T')[0],
      origin: 'Colombo Fort',
      destination: 'Kandy',
      departureTime: '14:00',
      arrivalTime: '17:30',
      distanceKm: 116,
      stops: [],
    },
    {
      trainId: createdTrains[1]?._id,
      journeyDate: tomorrow.toISOString().split('T')[0],
      origin: 'Kandy',
      destination: 'Colombo Fort',
      departureTime: '06:30',
      arrivalTime: '10:00',
      distanceKm: 116,
      stops: [
        { stationName: 'Rambukkana', stationCode: 'RBK', arrivalTime: '07:30', departureTime: '07:35', distanceFromOrigin: 31 },
        { stationName: 'Gampaha',    stationCode: 'GPH', arrivalTime: '09:00', departureTime: '09:02', distanceFromOrigin: 81 },
      ],
    },
    {
      trainId: createdTrains[2]?._id,
      journeyDate: tomorrow.toISOString().split('T')[0],
      origin: 'Colombo Fort',
      destination: 'Matara',
      departureTime: '22:00',
      arrivalTime: '03:30',
      distanceKm: 162,
      stops: [
        { stationName: 'Galle', stationCode: 'GLE', arrivalTime: '01:15', departureTime: '01:20', distanceFromOrigin: 116 },
      ],
    },
  ].filter(s => s.trainId);  // only create schedules where train was seeded

  const createdSchedules = [];
  for (const s of schedules) {
    try {
      const res = await axios.post(`${TRAIN_SVC}/api/schedules`, s);
      createdSchedules.push(res.data.data);
      console.log(`  ✓ Created schedule: ${s.origin} → ${s.destination} on ${s.journeyDate}`);
    } catch (e) {
      console.log(`  ⚠ Schedule error: ${e.response?.data?.message || e.message}`);
    }
  }

  await sleep(500);

  // ── 3. Initialize Seat Inventories ────────────────────────────────────────
  console.log('\nInitializing seat inventories...');
  for (let i = 0; i < createdSchedules.length; i++) {
    const schedule = createdSchedules[i];
    const train = createdTrains.find(t => t._id === schedule.trainId?.toString() || t._id === schedule.trainId);
    if (!train) continue;

    try {
      await axios.post(`${SEAT_SVC}/api/seats/initialize`, {
        scheduleId: schedule._id,
        trainId: train._id,
        totalSeats: train.totalSeats,
        classSummary: train.classes.map(c => ({
          className: c.className,
          total: c.seatCount,
          available: c.seatCount,
          pricePerKm: c.pricePerKm,
        })),
      });
      console.log(`  ✓ Initialized seats for schedule ${schedule._id}`);
    } catch (e) {
      console.log(`  ⚠ Seat init error: ${e.response?.data?.message || e.message}`);
    }
  }

  await sleep(500);

  // ── 4. Create a demo booking ──────────────────────────────────────────────
  if (createdSchedules.length > 0) {
    console.log('\nCreating demo booking...');
    const schedule = createdSchedules[0];
    const train = createdTrains.find(t => t._id === schedule.trainId?.toString() || t._id === schedule.trainId);

    try {
      const res = await axios.post(`${BOOK_SVC}/api/bookings`, {
        scheduleId:   schedule._id,
        trainId:      train?._id || schedule.trainId,
        seatClass:    'SECOND',
        contactEmail: 'demo@trainbooking.lk',
        journeyDate:  schedule.journeyDate,
        origin:       schedule.origin,
        destination:  schedule.destination,
        passengers: [
          { name: 'Amal Perera',  email: 'amal@example.com',  phone: '+94771234567', nationalId: '991234567V', age: 28 },
          { name: 'Sitha Kumari', email: 'sitha@example.com', phone: '+94779876543', nationalId: '001234568V', age: 24 },
        ],
      });
      console.log(`  ✓ Demo booking created: ${res.data.data.bookingReference}`);
    } catch (e) {
      console.log(`  ⚠ Booking error: ${e.response?.data?.message || e.message}`);
    }
  }

  console.log('\n✅ Seeding complete! Services are ready for demo.\n');
  console.log('Swagger API Docs:');
  console.log('  Train Management  → http://localhost:3001/api-docs');
  console.log('  Seat Availability → http://localhost:3002/api-docs');
  console.log('  Ticket Booking    → http://localhost:3003/api-docs');
  console.log('  Notification      → http://localhost:3004/api-docs');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

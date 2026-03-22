const router = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/bookingController');
const validate = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     Passenger:
 *       type: object
 *       required: [name, email, phone]
 *       properties:
 *         name: { type: string, example: Amal Perera }
 *         email: { type: string, format: email, example: amal@example.com }
 *         phone: { type: string, example: "+94771234567" }
 *         nationalId: { type: string, example: "991234567V" }
 *         age: { type: integer, example: 28 }
 *     Booking:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         bookingReference: { type: string, example: "BK-A1B2C3D4" }
 *         scheduleId: { type: string }
 *         trainId: { type: string }
 *         seatClass: { type: string, enum: [FIRST, SECOND, THIRD] }
 *         passengers:
 *           type: array
 *           items: { $ref: '#/components/schemas/Passenger' }
 *         totalAmount: { type: number, example: 750.00 }
 *         status: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *         contactEmail: { type: string }
 *         origin: { type: string }
 *         destination: { type: string }
 *         journeyDate: { type: string, format: date }
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: List bookings, optionally filtered by email or status
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of bookings
 */
router.get('/', ctrl.getAllBookings);

/**
 * @swagger
 * /api/bookings/ref/{reference}:
 *   get:
 *     summary: Get booking by booking reference number
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *         example: BK-A1B2C3D4
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get('/ref/:reference', ctrl.getBookingByReference);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by MongoDB ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get('/:id', param('id').isMongoId(), validate, ctrl.getBookingById);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new ticket booking
 *     description: |
 *       Orchestrates the full booking flow:
 *       1. Validates the schedule via Train Management Service
 *       2. Reserves seats via Seat Availability Service
 *       3. Calculates fare and persists the booking
 *       4. Publishes `booking.created` Kafka event for Notification Service
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduleId, trainId, seatClass, passengers, contactEmail, journeyDate, origin, destination]
 *             properties:
 *               scheduleId: { type: string }
 *               trainId: { type: string }
 *               seatClass: { type: string, enum: [FIRST, SECOND, THIRD] }
 *               contactEmail: { type: string, format: email }
 *               journeyDate: { type: string, format: date }
 *               origin: { type: string, example: Colombo }
 *               destination: { type: string, example: Kandy }
 *               passengers:
 *                 type: array
 *                 minItems: 1
 *                 items: { $ref: '#/components/schemas/Passenger' }
 *           example:
 *             scheduleId: "65f1a2b3c4d5e6f7a8b9c0d1"
 *             trainId: "65f1a2b3c4d5e6f7a8b9c0d2"
 *             seatClass: SECOND
 *             contactEmail: amal@example.com
 *             journeyDate: "2026-04-01"
 *             origin: Colombo
 *             destination: Kandy
 *             passengers:
 *               - name: Amal Perera
 *                 email: amal@example.com
 *                 phone: "+94771234567"
 *     responses:
 *       201:
 *         description: Booking confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error or cancelled schedule
 *       409:
 *         description: No seats available
 *       502:
 *         description: Upstream service unavailable
 */
router.post('/', [
  body('scheduleId').notEmpty(),
  body('trainId').notEmpty(),
  body('seatClass').isIn(['FIRST', 'SECOND', 'THIRD']),
  body('contactEmail').isEmail().normalizeEmail(),
  body('journeyDate').isISO8601(),
  body('origin').notEmpty().trim(),
  body('destination').notEmpty().trim(),
  body('passengers').isArray({ min: 1 }),
  body('passengers.*.name').notEmpty(),
  body('passengers.*.email').isEmail(),
  body('passengers.*.phone').notEmpty(),
], validate, ctrl.createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     description: |
 *       Cancels the booking, releases seats via Seat Availability Service,
 *       and publishes `booking.cancelled` Kafka event.
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Change of plans" }
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Already cancelled or completed
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', param('id').isMongoId(), validate, ctrl.cancelBooking);

module.exports = router;

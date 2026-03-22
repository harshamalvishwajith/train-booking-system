const router = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/scheduleController');
const validate = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stop:
 *       type: object
 *       properties:
 *         stationName: { type: string }
 *         stationCode: { type: string }
 *         arrivalTime: { type: string, example: "10:30" }
 *         departureTime: { type: string, example: "10:35" }
 *         distanceFromOrigin: { type: number }
 *         platform: { type: string }
 *     Schedule:
 *       type: object
 *       required: [trainId, journeyDate, origin, destination, departureTime, arrivalTime, distanceKm]
 *       properties:
 *         _id: { type: string }
 *         trainId: { type: string }
 *         journeyDate: { type: string, format: date }
 *         origin: { type: string, example: Colombo }
 *         destination: { type: string, example: Kandy }
 *         departureTime: { type: string, example: "07:00" }
 *         arrivalTime: { type: string, example: "10:30" }
 *         distanceKm: { type: number, example: 116 }
 *         stops: { type: array, items: { $ref: '#/components/schemas/Stop' } }
 *         status:
 *           type: string
 *           enum: [SCHEDULED, DELAYED, CANCELLED, COMPLETED]
 */

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Search schedules by route and date
 *     tags: [Schedules]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema: { type: string }
 *         example: Colombo
 *       - in: query
 *         name: destination
 *         schema: { type: string }
 *         example: Kandy
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         example: "2026-04-01"
 *     responses:
 *       200:
 *         description: List of matching schedules
 */
router.get('/', ctrl.searchSchedules);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule details with populated train info
 *       404:
 *         description: Schedule not found
 */
router.get('/:id', param('id').isMongoId(), validate, ctrl.getScheduleById);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created
 */
router.post('/', [
  body('trainId').isMongoId(),
  body('journeyDate').isISO8601(),
  body('origin').notEmpty().trim(),
  body('destination').notEmpty().trim(),
  body('departureTime').notEmpty(),
  body('arrivalTime').notEmpty(),
  body('distanceKm').isNumeric(),
], validate, ctrl.createSchedule);

/**
 * @swagger
 * /api/schedules/{id}/status:
 *   put:
 *     summary: Update schedule status (delay, cancel, complete)
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, DELAYED, CANCELLED, COMPLETED]
 *               delayMinutes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', [
  param('id').isMongoId(),
  body('status').isIn(['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED']),
], validate, ctrl.updateScheduleStatus);

module.exports = router;

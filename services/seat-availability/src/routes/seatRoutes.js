const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/seatController');
const validate = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassSummary:
 *       type: object
 *       properties:
 *         className: { type: string, enum: [FIRST, SECOND, THIRD] }
 *         total: { type: integer }
 *         available: { type: integer }
 *         pricePerKm: { type: number }
 *     SeatAvailability:
 *       type: object
 *       properties:
 *         scheduleId: { type: string }
 *         trainId: { type: string }
 *         totalSeats: { type: integer }
 *         availableSeats: { type: integer }
 *         classSummary:
 *           type: array
 *           items: { $ref: '#/components/schemas/ClassSummary' }
 */

/**
 * @swagger
 * /api/seats/{scheduleId}:
 *   get:
 *     summary: Get seat availability for a schedule
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seat availability summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeatAvailability'
 *       404:
 *         description: Schedule not found
 */
router.get('/:scheduleId', ctrl.getSeatAvailability);

/**
 * @swagger
 * /api/seats/{scheduleId}/detail:
 *   get:
 *     summary: Get full seat inventory including reserved seats (internal)
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full inventory with reserved seat list
 */
router.get('/:scheduleId/detail', ctrl.getSeatDetail);

/**
 * @swagger
 * /api/seats/initialize:
 *   post:
 *     summary: Initialize seat inventory for a schedule (called internally)
 *     tags: [Seats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduleId, trainId, totalSeats, classSummary]
 *             properties:
 *               scheduleId: { type: string }
 *               trainId: { type: string }
 *               totalSeats: { type: integer }
 *               classSummary:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/ClassSummary' }
 *     responses:
 *       201:
 *         description: Inventory initialized
 *       409:
 *         description: Already initialized
 */
router.post('/initialize', [
  body('scheduleId').notEmpty(),
  body('trainId').notEmpty(),
  body('totalSeats').isInt({ min: 1 }),
  body('classSummary').isArray({ min: 1 }),
], validate, ctrl.initializeInventory);

/**
 * @swagger
 * /api/seats/{scheduleId}/reserve:
 *   put:
 *     summary: Reserve seats for a booking
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, seatClass]
 *             properties:
 *               bookingId: { type: string }
 *               seatClass: { type: string, enum: [FIRST, SECOND, THIRD] }
 *               seatCount: { type: integer, default: 1 }
 *               passengerId: { type: string }
 *     responses:
 *       200:
 *         description: Seats reserved successfully
 *       409:
 *         description: Not enough seats available
 */
router.put('/:scheduleId/reserve', [
  body('bookingId').notEmpty(),
  body('seatClass').isIn(['FIRST', 'SECOND', 'THIRD']),
  body('seatCount').optional().isInt({ min: 1 }),
], validate, ctrl.reserveSeat);

/**
 * @swagger
 * /api/seats/{scheduleId}/release:
 *   put:
 *     summary: Release reserved seats (on booking cancellation)
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, seatClass]
 *             properties:
 *               bookingId: { type: string }
 *               seatClass: { type: string, enum: [FIRST, SECOND, THIRD] }
 *               seatCount: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Seats released
 */
router.put('/:scheduleId/release', [
  body('bookingId').notEmpty(),
  body('seatClass').isIn(['FIRST', 'SECOND', 'THIRD']),
], validate, ctrl.releaseSeat);

module.exports = router;

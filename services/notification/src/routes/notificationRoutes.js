const router = require('express').Router();
const { param } = require('express-validator');
const ctrl = require('../controllers/notificationController');
const validate = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         bookingId: { type: string }
 *         bookingReference: { type: string, example: "BK-A1B2C3D4" }
 *         recipientEmail: { type: string }
 *         type:
 *           type: string
 *           enum: [BOOKING_CONFIRMED, BOOKING_CANCELLED, SCHEDULE_CHANGED, REMINDER]
 *         subject: { type: string }
 *         status:
 *           type: string
 *           enum: [SENT, FAILED, PENDING]
 *         sentAt: { type: string, format: date-time }
 *         errorMessage: { type: string }
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List all notifications with optional filters
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *         description: Filter by recipient email
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [BOOKING_CONFIRMED, BOOKING_CANCELLED] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [SENT, FAILED, PENDING] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated notification list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 */
router.get('/', ctrl.getAllNotifications);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification delivery statistics grouped by type and status
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Stats grouped by type/status
 */
router.get('/stats', ctrl.getStats);

/**
 * @swagger
 * /api/notifications/booking/{bookingId}:
 *   get:
 *     summary: Get all notifications for a specific booking
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB booking ID
 *     responses:
 *       200:
 *         description: Notifications for the booking
 */
router.get('/booking/:bookingId', ctrl.getByBookingId);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a notification by its ID
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification detail
 *       404:
 *         description: Not found
 */
router.get('/:id', param('id').isMongoId(), validate, ctrl.getById);

module.exports = router;

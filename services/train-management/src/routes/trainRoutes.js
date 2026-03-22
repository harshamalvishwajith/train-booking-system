const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/trainController');
const validate = require('../middleware/validate');

/**
 * @swagger
 * components:
 *   schemas:
 *     TrainClass:
 *       type: object
 *       required: [className, seatCount, pricePerKm]
 *       properties:
 *         className:
 *           type: string
 *           enum: [FIRST, SECOND, THIRD]
 *         seatCount:
 *           type: integer
 *           example: 50
 *         pricePerKm:
 *           type: number
 *           example: 2.5
 *     Train:
 *       type: object
 *       required: [trainNumber, name, totalSeats, classes]
 *       properties:
 *         _id:
 *           type: string
 *         trainNumber:
 *           type: string
 *           example: EXP001
 *         name:
 *           type: string
 *           example: Colombo Express
 *         type:
 *           type: string
 *           enum: [EXPRESS, INTERCITY, LOCAL, NIGHT]
 *         totalSeats:
 *           type: integer
 *           example: 200
 *         classes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TrainClass'
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get all trains
 *     tags: [Trains]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [EXPRESS, INTERCITY, LOCAL, NIGHT]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of trains
 */
router.get('/', ctrl.getAllTrains);

/**
 * @swagger
 * /api/trains/{id}:
 *   get:
 *     summary: Get a train by ID
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Train details
 *       404:
 *         description: Train not found
 */
router.get('/:id', param('id').isMongoId(), validate, ctrl.getTrainById);

/**
 * @swagger
 * /api/trains:
 *   post:
 *     summary: Create a new train
 *     tags: [Trains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Train'
 *           example:
 *             trainNumber: EXP001
 *             name: Colombo Express
 *             type: EXPRESS
 *             totalSeats: 200
 *             classes:
 *               - className: FIRST
 *                 seatCount: 50
 *                 pricePerKm: 5.0
 *               - className: SECOND
 *                 seatCount: 150
 *                 pricePerKm: 2.5
 *     responses:
 *       201:
 *         description: Train created
 *       400:
 *         description: Validation error
 */
router.post('/', [
  body('trainNumber').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('type').optional().isIn(['EXPRESS', 'INTERCITY', 'LOCAL', 'NIGHT']),
  body('totalSeats').isInt({ min: 1 }),
  body('classes').isArray({ min: 1 }),
], validate, ctrl.createTrain);

/**
 * @swagger
 * /api/trains/{id}:
 *   put:
 *     summary: Update a train
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Train'
 *     responses:
 *       200:
 *         description: Train updated
 */
router.put('/:id', param('id').isMongoId(), validate, ctrl.updateTrain);

/**
 * @swagger
 * /api/trains/{id}:
 *   delete:
 *     summary: Deactivate a train (soft delete)
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Train deactivated
 */
router.delete('/:id', param('id').isMongoId(), validate, ctrl.deleteTrain);

module.exports = router;

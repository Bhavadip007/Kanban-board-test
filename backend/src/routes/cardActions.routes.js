const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const validateObjectId = require('../middleware/validateParams.middleware');
const { updateCardSchema, moveCardSchema } = require('../validators/card.validator');
const cardController = require('../controllers/card.controller');

const router = express.Router();

router.use(authenticate);

router.patch('/:id', validateObjectId, validate(updateCardSchema), cardController.updateCard);
router.delete('/:id', validateObjectId, cardController.deleteCard);
router.post('/:id/move', validateObjectId, validate(moveCardSchema), cardController.moveCard);

module.exports = router;

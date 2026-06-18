const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const validateObjectId = require('../middleware/validateParams.middleware');
const { createCardSchema } = require('../validators/card.validator');
const cardController = require('../controllers/card.controller');

const router = express.Router();

router.use(authenticate);

router.post('/:id/cards', validateObjectId, validate(createCardSchema), cardController.createCard);

module.exports = router;

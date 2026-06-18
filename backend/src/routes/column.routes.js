const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const validateObjectId = require('../middleware/validateParams.middleware');
const { updateColumnSchema } = require('../validators/column.validator');
const columnController = require('../controllers/column.controller');

const router = express.Router();

router.use(authenticate);

router.patch('/:id', validateObjectId, validate(updateColumnSchema), columnController.updateColumn);
router.delete('/:id', validateObjectId, columnController.deleteColumn);

module.exports = router;

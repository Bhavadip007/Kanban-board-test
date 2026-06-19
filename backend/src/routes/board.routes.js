const express = require('express');
const { authenticate, requireManager } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const validateObjectId = require('../middleware/validateParams.middleware');
const { createBoardSchema, updateBoardSchema } = require('../validators/board.validator');
const boardController = require('../controllers/board.controller');
const columnController = require('../controllers/column.controller');
const { createColumnSchema } = require('../validators/column.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', boardController.listBoards);
router.post('/', requireManager, validate(createBoardSchema), boardController.createBoard);
router.get('/:id', validateObjectId, boardController.getBoard);
router.patch('/:id', validateObjectId, validate(updateBoardSchema), boardController.updateBoard);
router.delete('/:id', validateObjectId, boardController.deleteBoard);
router.post('/:id/columns', validateObjectId, validate(createColumnSchema), columnController.createColumn);

module.exports = router;

const express = require('express');
const { authenticate, requireManager } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.use(authenticate, requireManager);

router.get('/', userController.listAssignableUsers);

module.exports = router;

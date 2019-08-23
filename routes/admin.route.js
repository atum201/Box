const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { mustBeAdmin } = require('../helpers/admin.helper');

router.post('/login', AdminController.login);
router.put('/', mustBeAdmin, AdminController.editInfo);
router.get('/info', mustBeAdmin, AdminController.getInfo);

module.exports = router;
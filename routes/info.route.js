const express = require('express');
const router = express.Router();
const InfoController = require('../controllers/info.controller');
const { mustBeAdmin } = require('../helpers/admin.helper');

router.put('/',mustBeAdmin, InfoController.edit);   
router.get('/detail', InfoController.getDetail);

module.exports = router;
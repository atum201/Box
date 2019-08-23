const express = require('express');
const router = express.Router();
const FactController = require('../controllers/fact.controller');

router.get('/list', FactController.getList);

router.get('/detail/:fact_id', FactController.getDetail);

router.post('/', FactController.create);

router.put('/:fact_id', FactController.edit);

router.delete('/:fact_id',, FactController.remove);

module.exports = router;
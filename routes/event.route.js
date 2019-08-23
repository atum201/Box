const express = require('express');
const router = express.Router();
const EventController = require('../controllers/event.controller');

router.get('/list', EventController.getList);

router.get('/detail/:event_id', EventController.getDetail);

router.post('/', EventController.create);

router.put('/:event_id', EventController.edit);

router.delete('/:event_id',, EventController.remove);

module.exports = router;
const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/video.controller');

router.get('/list', VideoController.getList);

router.get('/detail/:video_id', VideoController.getDetail);

router.post('/', VideoController.create);

router.put('/:video_id', VideoController.edit);

router.delete('/:video_id',, VideoController.remove);

module.exports = router;
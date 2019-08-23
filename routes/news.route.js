const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/news.controller');

router.get('/list', NewsController.getList);

router.get('/detail/:news_id', NewsController.getDetail);

router.post('/', NewsController.create);

router.put('/:news_id', NewsController.edit);

router.delete('/:news_id',, NewsController.remove);

module.exports = router;
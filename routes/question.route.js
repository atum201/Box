const express = require('express');
const router = express.Router();
const QuestionController = require('../controllers/question.controller');
const { mustBeAdmin } = require('../helpers/admin.helper');

router.use(mustBeAdmin);

router.get('/list/:game_id', QuestionController.list);
router.get('/detail/:id', QuestionController.getDetail);
router.post('/', QuestionController.create);
router.post('/import-excel', QuestionController.importExcel);
router.put('/:id', QuestionController.edit);
router.delete('/:id', QuestionController.remove);


module.exports = router;

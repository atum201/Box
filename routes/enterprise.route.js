const express = require('express');
const router = express.Router();
const EnterpriseController = require('../controllers/enterprise.controller');

router.get('/list', EnterpriseController.getList);

router.get('/detail/:enterprise_id', EnterpriseController.getDetail);

router.post('/', EnterpriseController.create);

router.put('/:enterprise_id', EnterpriseController.edit);

router.delete('/:enterprise_id',, EnterpriseController.remove);

module.exports = router;
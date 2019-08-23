const express = require('express');
const router = express.Router();
const GameController = require('../controllers/game.controller');
const {mustBeAdmin} = require('../helpers/admin.helper');

router.get('/result', GameController.getResult);

router.get('/list-finish-result', GameController.getListFinishResult);

router.get('/detail/:game_id', mustBeAdmin, GameController.getDetail);

router.get('/result-detail/:game_id', GameController.getResultDetail);

router.get('/info-pending-page', GameController.getGameForPendingPage);

router.get('/export', GameController.export);

router.post('/', mustBeAdmin, GameController.create);

router.put('/:game_id', mustBeAdmin, GameController.edit);

router.delete('/:game_id', mustBeAdmin, GameController.remove);

module.exports = router;
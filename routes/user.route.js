const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.get('/userByGame/:game_id', UserController.getUserByGameId);
router.get('/getList', UserController.getListUser);
router.get('/getDetail/:user_id', UserController.getDetail);

module.exports = router;
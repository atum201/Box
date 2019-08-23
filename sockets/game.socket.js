const Game = require('../models/game.model');
const User = require('../models/user.model');
const Question = require('../models/question.model');
const Result = require('../models/result.model');
const moment = require('moment');

module.exports.getResult = (game_id) => {
    return Game.init().then(async () => {
        let game = await Game.findOne({ game_id });
        if (!game)
            throw new Error('GAME_NOT_FOUND');
        let bonus = game.bonus;
        let count = await Result.countDocuments({ game_id, status: 'WIN' });
        let bonusPerPerson = 0;
        if (count != 0)
            bonusPerPerson = (Math.floor((bonus / count) / 10000)) * 10000;

        return {
            bonus,
            winner: count,
            bonusPerPerson
        };

    }).catch(error => console.log(error));
}

module.exports.responseGameInfo = (socket, io, game) => {
    if (!game) {
        if (socket)
            return socket.emit('responseGameInfo', { success: true, data: { status: 'PENDING' } });
        if (io)
            return io.emit('responseGameInfo', { success: true, data: { status: 'PENDING' } });
    }

    let temp = JSON.stringify(game);
    temp = JSON.parse(temp);
    delete temp.questions;
    if (socket)
        socket.emit('responseGameInfo', { success: true, data: { ...temp, createdAt: null, updatedAt: null } });
    if (io)
        io.emit('responseGameInfo', { success: true, data: { ...temp, createdAt: null, updatedAt: null } });
}

module.exports.open = async (game_id) => {

    let game = await Game.findOne({ game_id }).populate('questions');
    if (!game)
        throw new Error('GAME_NOT_FOUND');

    if (game.status == 'OPENING')
        throw new Error('GAME_IS_OPENING');

    if (game.status == 'PLAYING')
        throw new Error('GAME_IS_PLAYING');

    if (game.status == 'FINISHED')
        throw new Error('GAME_IS_FINISHED');

    let checkOpen = await Game.findOne({ $or: [{ status: 'OPENING' }, { status: 'PLAYING' }] });
    if (checkOpen)
        throw new Error('ANOTHER_GAME_IS_OPENING');

    if (moment() > moment(game.start_date))
        throw new Error('START_DATE_INVALID');

    if (game.questions.length < 10)
        throw new Error('NOT_ENOUGH_10_QUESTIONS');

    if (game.questions.length > 10)
        throw new Error('ALLOW_ONLY_10_QUESTIONS');

    for (let i = 1; i <= 10; i++) {
        let checkOrdinalNum = await Question.findOne({ game_id, ordinalNumber: i });
        if (!checkOrdinalNum)
            throw new Error('ORDINAL_NUMBER_NOT_FROM_1_TO_10');
    }

    game = await Game.findByIdAndUpdate(game._id, { status: 'OPENING' }, { new: true }).populate('questions');

    const watchingRoom = Math.ceil(Math.random() * 100000);
    const playRoom = game.game_id;
    const listQuestion = game.questions;
    const currentQuestion = 1;
    const timeRemaining = moment(game.start_date).diff(moment(), "seconds");

    return {
        game,
        watchingRoom,
        playRoom,
        listQuestion,
        currentQuestion,
        timeRemaining
    }
}
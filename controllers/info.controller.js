const Info = require('../models/info.model');
const Game = require('../models/game.model');
const { responseOk, responseError } = require('../helpers/paginate.helper');

module.exports.getDetail = (req, res) => {
    return Info.findOne()
        .then(info => {
            if (!info)
                return responseError(res, 404, 'INFO_NOT_FOUND');
            return responseOk(res, info);
        })
        .catch(error => {
            console.log('info: ' + error.message);
            responseError(res, 500, error.message);
        });
}

module.exports.edit = (req, res) => {
    const { law, waitForTheAnswer, waitForTheNextQuestion } = req.body;

    if (!Number.isInteger(+waitForTheAnswer)) {
        console.log('WAIT_FOR_THE_ANSWER_MUST_BE_NUMBER')
        return responseError(res, 701, "WAIT_FOR_THE_ANSWER_MUST_BE_NUMBER");
    }

    if (!Number.isInteger(+waitForTheNextQuestion)) {
        console.log('WAIT_FOR_THE_NEXT_QUESTION_MUST_BE_NUMBER');
        return responseError(res, 702, "WAIT_FOR_THE_NEXT_QUESTION_MUST_BE_NUMBER");
    }

    return Game.findOne({ status: { $in: ['OPENING', 'PLAYING'] } })
        .then(game => {
            if (game && game.status == 'OPENING')
                throw new Error('GAME_IS_OPENING');

            if (game && game.status == 'PLAYING')
                throw new Error('GAME_IS_PLAYING');
        })
        .then(() => Info.findOneAndUpdate({}, { law, waitForTheAnswer, waitForTheNextQuestion }, { new: true }))
        .then(info => {
            if (!info)
                throw new Error('INFO_NOT_FOUND');

            return responseOk(res, info);
        })
        .catch(error => {
            console.log('info: ' + error.message);
            responseError(res, 500, error.message);
        });
}